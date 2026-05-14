return (
  <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-gradient-to-r from-green-800 via-green-700 to-green-800 border-b border-green-500/40 shadow-2xl">

    <div className="w-full h-16 px-4 lg:px-8 flex items-center justify-between">

      {/* LEFT SIDE */}
      <div className="flex items-center gap-8">

        {/* LOGO AREA */}
        <div className="flex items-center gap-4">

          <div className="relative">
            <div className="absolute inset-0 bg-white/20 blur-xl rounded-full"></div>

            <div className="relative bg-white rounded-2xl p-2.5 shadow-lg border border-white/30">
              <img
                src="https://www.mazzraty.com/_next/image?url=%2Fimages%2FMazzraty_Logo.png&w=3840&q=75"
                alt="logo"
                className="h-8 object-contain"
              />
            </div>
          </div>

          <div className="leading-tight">
            <h1 className="text-white text-lg font-bold tracking-wide">
              HelpyFy
            </h1>

            <p className="text-[11px] text-green-100 tracking-wider uppercase">
              SAP IT Helpdesk System
            </p>
          </div>
        </div>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden lg:flex items-center gap-2">

          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`relative px-4 py-2.5 rounded-2xl text-sm transition-all duration-300 ${
                location.pathname === item.path
                  ? "bg-white text-green-700 shadow-lg font-semibold"
                  : "text-white/90 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}

        </nav>
      </div>

      {/* RIGHT SIDE */}
      <div
        className="flex items-center gap-3 relative"
        ref={dropdownRef}
      >

        {/* SEARCH BUTTON */}
        <button className="hidden md:flex items-center justify-center w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all">
          🔍
        </button>

        {/* NOTIFICATION */}
        <button className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all">

          🔔

          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-white text-green-700 text-[10px] font-bold rounded-full shadow-md px-1">
              {notifications}
            </span>
          )}
        </button>

        {/* ROLE */}
        <div className="hidden md:flex items-center px-3 py-2 rounded-2xl bg-white/10 border border-white/10 text-white text-xs font-medium capitalize backdrop-blur-md">
          {role}
        </div>

        {/* USER PROFILE */}
        <button
          onClick={() => setOpen(!open)}
          className="relative w-11 h-11 rounded-2xl bg-white text-green-700 flex items-center justify-center font-bold shadow-xl border-2 border-white/40 hover:scale-105 transition-all"
        >
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </button>

        {/* DROPDOWN */}
        {open && (
          <div className="absolute right-0 top-14 w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">

            {/* HEADER */}
            <div className="bg-gradient-to-r from-green-50 to-white px-5 py-5 border-b">

              <div className="flex items-center gap-3">

                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-green-600 to-green-700 text-white flex items-center justify-center font-bold shadow-md">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-gray-500">
                    Signed in as
                  </p>

                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {user?.email || "Guest"}
                  </p>
                </div>
              </div>
            </div>

            {/* ROLE */}
            <div className="px-5 py-4 border-b">

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Access Role
                </span>

                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold capitalize">
                  {role}
                </span>
              </div>
            </div>

            {/* MENU */}
            <div className="p-2">

              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-600 hover:bg-red-50 transition-all text-sm font-medium"
              >
                🚪 Logout
              </button>

            </div>
          </div>
        )}

        {/* MOBILE MENU BUTTON */}
        <button
          onClick={() => setMobileMenu(!mobileMenu)}
          className="lg:hidden w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xl transition-all"
        >
          ☰
        </button>
      </div>
    </div>

    {/* MOBILE MENU */}
    {mobileMenu && (
      <div className="lg:hidden border-t border-white/10 bg-green-800/95 backdrop-blur-xl px-4 py-4">

        <div className="space-y-2">

          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenu(false)}
              className={`block px-4 py-3 rounded-2xl text-sm transition-all ${
                location.pathname === item.path
                  ? "bg-white text-green-700 font-semibold"
                  : "text-white hover:bg-white/10"
              }`}
            >
              {item.label}
            </Link>
          ))}

        </div>
      </div>
    )}
  </header>
);