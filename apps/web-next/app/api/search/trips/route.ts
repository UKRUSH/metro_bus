import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Route from '@/lib/models/Route';
import Schedule from '@/lib/models/Schedule';
import Bus from '@/lib/models/Bus';
import Booking from '@/lib/models/Booking';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    
    // Search parameters
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const date = searchParams.get('date');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const busType = searchParams.get('busType');
    const timeOfDay = searchParams.get('timeOfDay'); // 'morning', 'afternoon', 'evening', 'night'
    const minSeats = searchParams.get('minSeats');
    const sortBy = searchParams.get('sortBy') || 'departureTime'; // 'price', 'departureTime', 'duration'

    // Build route query
    const routeQuery: any = { isActive: true };
    
    if (origin) {
      routeQuery.origin = { $regex: origin, $options: 'i' };
    }
    
    if (destination) {
      routeQuery.destination = { $regex: destination, $options: 'i' };
    }

    if (minPrice || maxPrice) {
      routeQuery.fare = {};
      if (minPrice) routeQuery.fare.$gte = Number(minPrice);
      if (maxPrice) routeQuery.fare.$lte = Number(maxPrice);
    }

    // Find matching routes
    const routes = await Route.find(routeQuery);
    const routeIds = routes.map(r => r._id);

    if (routeIds.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        total: 0,
        message: 'No routes found matching your criteria',
      });
    }

    // Build schedule query
    const scheduleQuery: any = {
      routeId: { $in: routeIds },
      isActive: true,
    };

    // Date filter
    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      scheduleQuery.departureTime = {
        $gte: searchDate,
        $lt: nextDay,
      };
    } else {
      // Default to today and future
      scheduleQuery.departureTime = { $gte: new Date() };
    }

    // Time of day filter
    if (timeOfDay) {
      const now = new Date();
      const timeRanges: any = {
        morning: { start: 6, end: 12 },
        afternoon: { start: 12, end: 17 },
        evening: { start: 17, end: 21 },
        night: { start: 21, end: 6 },
      };

      const range = timeRanges[timeOfDay];
      if (range) {
        // This is a simplified version - you may need more complex logic
        scheduleQuery.$expr = {
          $and: [
            { $gte: [{ $hour: '$departureTime' }, range.start] },
            { $lt: [{ $hour: '$departureTime' }, range.end] },
          ],
        };
      }
    }

    // Find schedules
    let schedules = await Schedule.find(scheduleQuery)
      .populate('routeId', 'name code origin destination fare distance estimatedDuration')
      .populate('busId', 'registrationNumber busType capacity facilities')
      .limit(100);

    // Filter by bus type
    if (busType) {
      schedules = schedules.filter(schedule => {
        if (typeof schedule.busId === 'object' && schedule.busId) {
          return schedule.busId.busType?.toLowerCase() === busType.toLowerCase();
        }
        return false;
      });
    }

    // Calculate available seats for each schedule
    const results = await Promise.all(
      schedules.map(async (schedule) => {
        // Get bookings for this schedule
        const bookings = await Booking.find({
          scheduleId: schedule._id,
          status: { $in: ['pending', 'confirmed'] },
        });

        const bookedSeats = bookings.reduce((total, booking) => {
          return total + (booking.seatNumbers?.length || 1);
        }, 0);

        const bus = schedule.busId as any;
        const totalSeats = bus?.capacity || 50;
        const availableSeats = totalSeats - bookedSeats;

        return {
          scheduleId: schedule._id,
          route: schedule.routeId,
          bus: schedule.busId,
          departureTime: schedule.departureTime,
          arrivalTime: schedule.arrivalTime,
          availableSeats,
          totalSeats,
          bookedSeats,
          occupancyRate: ((bookedSeats / totalSeats) * 100).toFixed(1),
        };
      })
    );

    // Filter by minimum available seats
    let filteredResults = results;
    if (minSeats) {
      filteredResults = results.filter(r => r.availableSeats >= Number(minSeats));
    }

    // Sort results
    filteredResults.sort((a, b) => {
      if (sortBy === 'price') {
        const priceA = (a.route as any)?.fare || 0;
        const priceB = (b.route as any)?.fare || 0;
        return priceA - priceB;
      } else if (sortBy === 'duration') {
        const durationA = (a.route as any)?.estimatedDuration || 0;
        const durationB = (b.route as any)?.estimatedDuration || 0;
        return durationA - durationB;
      } else {
        // Sort by departure time (default)
        return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
      }
    });

    return NextResponse.json({
      success: true,
      results: filteredResults,
      total: filteredResults.length,
      filters: {
        origin,
        destination,
        date,
        busType,
        timeOfDay,
        minPrice,
        maxPrice,
        minSeats,
        sortBy,
      },
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to search trips',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
