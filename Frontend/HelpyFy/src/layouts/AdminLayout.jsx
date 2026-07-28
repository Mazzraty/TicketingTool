import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api/axios";
import { changeFavicon } from "../utils/favicon";

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);


  // Check new ticket notifications
  const loadNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      const notifications = res.data.data || [];

      const unreadNewTicket = notifications.some((item) => {
        const title = (item.title || "").toLowerCase();
        return (
          !item.isRead &&
          (item.type === "ticket_created" ||
            item.type === "ticket" ||
            title.includes("new ticket"))
        );
      });

      changeFavicon(unreadNewTicket);
    } catch (error) {
      console.log("Notification check failed", error);
    }
  };


  useEffect(() => {

    // first load
    loadNotifications();


    // check every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);


    return () => clearInterval(interval);

  }, []);


  return (
    <div className="min-h-screen bg-[#f5f6f7]">

      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <Navbar />
      </header>


      {/* BODY */}
      <div className="flex pt-16">


        {/* SIDEBAR */}
        <aside
          className={`fixed left-0 top-16 h-[calc(100vh-64px)] z-40 transition-all duration-300 ${
            collapsed ? "w-[90px]" : "w-[280px]"
          }`}
        >

          <Sidebar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
          />

        </aside>


        {/* PAGE CONTENT */}
        <main
          className={`flex-1 p-6 overflow-auto min-h-[calc(100vh-64px)] transition-all duration-300 ${
            collapsed ? "ml-[90px]" : "ml-[280px]"
          }`}
        >

          <Outlet />

        </main>


      </div>

    </div>
  );
}