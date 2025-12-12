import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Metro Bus</h1>
            </div>
            <div className="flex gap-3">
              <div className="relative group">
                <button className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-gray-50 border border-blue-600">
                  Register ▼
                </button>
                <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <Link href="/register" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b">
                    👤 Passenger
                  </Link>
                  <Link href="/register/driver" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b">
                    🚌 Driver
                  </Link>
                  <Link href="/register/owner" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                    🏢 Bus Owner
                  </Link>
                </div>
              </div>
              <Link
                href="/login"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Travel Smart with
              <span className="block text-blue-600">Metro Bus System</span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              Book tickets online, track buses in real-time, and manage your travel with ease.
              Experience the future of public transportation.
            </p>
            <div className="mt-10 flex items-center justify-center gap-6">
              <Link
                href="/register"
                className="rounded-lg bg-blue-600 px-8 py-4 text-base font-semibold text-white hover:bg-blue-700 shadow-lg"
              >
                Book Your Ticket
              </Link>
              <Link
                href="/login"
                className="rounded-lg bg-white px-8 py-4 text-base font-semibold text-blue-600 hover:bg-gray-50 border-2 border-blue-600"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Stakeholder Access Section */}
          <div className="mt-16 rounded-2xl bg-white p-8 shadow-lg">
            <h3 className="mb-6 text-center text-2xl font-bold text-gray-900">
              Stakeholder Access
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/login"
                className="group rounded-lg border-2 border-blue-600 p-6 text-center transition-all hover:bg-blue-600"
              >
                <div className="mb-3 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 group-hover:bg-white">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <h4 className="mb-2 font-semibold text-gray-900 group-hover:text-white">Admin Login</h4>
                <p className="text-sm text-gray-600 group-hover:text-white">System Management</p>
              </Link>

              <Link
                href="/login"
                className="group rounded-lg border-2 border-green-600 p-6 text-center transition-all hover:bg-green-600"
              >
                <div className="mb-3 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 group-hover:bg-white">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                  </div>
                </div>
                <h4 className="mb-2 font-semibold text-gray-900 group-hover:text-white">Owner Login</h4>
                <p className="text-sm text-gray-600 group-hover:text-white">Fleet Management</p>
              </Link>

              <Link
                href="/login"
                className="group rounded-lg border-2 border-purple-600 p-6 text-center transition-all hover:bg-purple-600"
              >
                <div className="mb-3 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 group-hover:bg-white">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <h4 className="mb-2 font-semibold text-gray-900 group-hover:text-white">Driver Login</h4>
                <p className="text-sm text-gray-600 group-hover:text-white">Trip Management</p>
              </Link>

              <Link
                href="/login"
                className="group rounded-lg border-2 border-yellow-600 p-6 text-center transition-all hover:bg-yellow-600"
              >
                <div className="mb-3 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 group-hover:bg-white">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h4 className="mb-2 font-semibold text-gray-900 group-hover:text-white">Finance Login</h4>
                <p className="text-sm text-gray-600 group-hover:text-white">Financial Management</p>
              </Link>
            </div>
            <p className="mt-6 text-center text-sm text-gray-600">
              💡 Staff members use provided credentials • Passengers can{' '}
              <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700">
                register here
              </Link>
            </p>
          </div>

          {/* Features */}
          <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl bg-white p-8 shadow-lg">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                <svg
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">Real-Time Tracking</h3>
              <p className="text-gray-600">
                Track your bus location in real-time and get accurate arrival estimates.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow-lg">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">Easy Booking</h3>
              <p className="text-gray-600">
                Book tickets instantly with our user-friendly interface and secure payment.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow-lg">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
                <svg
                  className="h-8 w-8 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">Season Passes</h3>
              <p className="text-gray-600">
                Save money with monthly and yearly season passes for regular travelers.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-600">
            &copy; 2024 Metro Bus System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
