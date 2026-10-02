import React, { useState, useEffect } from "react";
import { apiFetch } from "../services/apiClient";
import { Building2, UserPlus, ShieldAlert, Loader2, CheckCircle2, MapPin, Plus, Trash2 } from "lucide-react";

export default function AdminPage() {
  const [buildings, setBuildings] = useState<any[]>([]);

  // Building Form State
  const [bldgName, setBldgName] = useState("");
  const [bldgCity, setBldgCity] = useState("");
  const [bldgArea, setBldgArea] = useState("12500");
  const [bldgFloors, setBldgFloors] = useState("6");

  // Custom Rooms and Equipment State
  const [rooms, setRooms] = useState([{ name: "Executive Boardroom", floor: "1", zone: "Meeting" }]);
  const [equipment, setEquipment] = useState([{ name: "Main Chiller", eq_type: "chiller", power_draw_kw: "115" }]);

  const [bLoading, setBLoading] = useState(false);
  const [bMsg, setBMsg] = useState("");

  // User Form State
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userFullName, setUserFullName] = useState("");
  const [userRole, setUserRole] = useState("tenant");
  const [selectedBuildingIds, setSelectedBuildingIds] = useState<string[]>([]);
  const [uLoading, setULoading] = useState(false);
  const [uMsg, setUMsg] = useState("");

  const fetchBuildings = async () => {
    try {
      const data = await apiFetch("/admin/buildings");
      setBuildings(data);
      if (data.length > 0 && selectedBuildingIds.length === 0) {
        setSelectedBuildingIds([data[0].id]);
      }
    } catch (err) {
      console.error("Failed to fetch buildings", err);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  const handleAddBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    setBLoading(true); setBMsg("");
    try {
      const res = await apiFetch("/admin/buildings", {
        method: "POST",
        body: JSON.stringify({
          name: bldgName, city: bldgCity,
          area_m2: parseInt(bldgArea), floors: parseInt(bldgFloors),
          rooms, equipment
        }),
      });
      setBMsg(res.message);
      setBldgName(""); setBldgCity("");
      setRooms([{ name: "Executive Boardroom", floor: "1", zone: "Meeting" }]);
      setEquipment([{ name: "Main Chiller", eq_type: "chiller", power_draw_kw: "115" }]);
      fetchBuildings();
    } catch (err: any) {
      setBMsg(`Error: ${err.message}`);
    } finally {
      setBLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setULoading(true); setUMsg("");
    try {
      const res = await apiFetch("/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email: userEmail, password: userPassword, full_name: userFullName,
          role: userRole, building_ids: selectedBuildingIds
        }),
      });
      setUMsg(res.message);
      setUserEmail(""); setUserPassword(""); setUserFullName("");
    } catch (err: any) {
      setUMsg(`Error: ${err.message}`);
    } finally {
      setULoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-emerald-600" /> Platform Administration
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Provision new assets with custom floors/rooms and manage multi-tenant user access.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* REGISTER BUILDING WITH MANUAL ROOMS FORM */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" /> Register Building & Custom Rooms
          </h2>
          <form onSubmit={handleAddBuilding} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Building Name</label>
              <input type="text" required placeholder="e.g. Apex Tech Park" value={bldgName} onChange={(e) => setBldgName(e.target.value)} className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white px-3 py-2 text-sm focus:outline-none" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">City</label>
                <input type="text" required placeholder="Pune" value={bldgCity} onChange={(e) => setBldgCity(e.target.value)} className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Area (m²)</label>
                <input type="number" required value={bldgArea} onChange={(e) => setBldgArea(e.target.value)} className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Floors</label>
                <input type="number" required value={bldgFloors} onChange={(e) => setBldgFloors(e.target.value)} className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white px-3 py-2 text-sm focus:outline-none" />
              </div>
            </div>

            {/* MANUAL ROOM BUILDER */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Rooms & Zones Configuration</label>
                <button type="button" onClick={() => setRooms([...rooms, { name: "", floor: "1", zone: "Office" }])} className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Add Room
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {rooms.map((room, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                    <input type="text" placeholder="Room Name" value={room.name} onChange={(e) => { const r = [...rooms]; r[idx].name = e.target.value; setRooms(r); }} className="flex-1 bg-transparent text-xs dark:text-white focus:outline-none" required />
                    <input type="text" placeholder="Floor" value={room.floor} onChange={(e) => { const r = [...rooms]; r[idx].floor = e.target.value; setRooms(r); }} className="w-14 bg-transparent text-xs dark:text-white focus:outline-none" required />
                    <input type="text" placeholder="Zone" value={room.zone} onChange={(e) => { const r = [...rooms]; r[idx].zone = e.target.value; setRooms(r); }} className="w-20 bg-transparent text-xs dark:text-white focus:outline-none" />
                    {rooms.length > 1 && (
                      <button type="button" onClick={() => setRooms(rooms.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button disabled={bLoading} type="submit" className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 transition shadow-sm">
              {bLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Provision Building with Rooms"}
            </button>
          </form>
          {bMsg && <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />{bMsg}</p>}
        </div>

        {/* REGISTER USER ACCOUNT FORM */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
            <UserPlus className="w-4 h-4 text-emerald-600" /> Register User Account
          </h2>
          <form onSubmit={handleAddUser} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Full Name</label>
                <input type="text" required placeholder="John Doe" value={userFullName} onChange={(e) => setUserFullName(e.target.value)} className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Role</label>
                <select value={userRole} onChange={(e) => { setUserRole(e.target.value); }} className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white px-3 py-2 text-sm focus:outline-none">
                  <option value="tenant">Tenant</option>
                  <option value="facility_manager">Facility Manager</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Email Address</label>
              <input type="email" required placeholder="user@demo.com" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white px-3 py-2 text-sm focus:outline-none" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Password</label>
              <input type="password" required placeholder="••••••••" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white px-3 py-2 text-sm focus:outline-none" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Assign Buildings</label>
              <div className="max-h-28 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {buildings.map(b => (
                  <label key={b.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type={userRole === "tenant" ? "radio" : "checkbox"}
                      name="buildingSelection"
                      checked={selectedBuildingIds.includes(b.id)}
                      onChange={() => {
                        if (userRole === "tenant") setSelectedBuildingIds([b.id]);
                        else setSelectedBuildingIds(prev => prev.includes(b.id) ? prev.filter(id => id !== b.id) : [...prev, b.id]);
                      }}
                      className="accent-emerald-600"
                    />
                    <span className="font-medium">{b.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <button disabled={uLoading} type="submit" className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 transition shadow-sm">
              {uLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
            </button>
          </form>
          {uMsg && <p className="mt-3 text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />{uMsg}</p>}
        </div>

      </div>

      {/* ACTIVE BUILDINGS LIST */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-emerald-600" /> Active Platform Buildings ({buildings.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {buildings.map(b => (
            <div key={b.id} className="rounded-xl bg-emerald-50/40 dark:bg-slate-800/60 border border-emerald-100 dark:border-slate-700 p-3.5">
              <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{b.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{b.city} · {b.area_m2?.toLocaleString()} m² · {b.floors} floors</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}