import React, { useState, useEffect } from "react";
import { apiFetch } from "../services/apiClient";
import { Building2, UserPlus, ShieldAlert, Loader2, CheckCircle2, Plus, Trash2, LayoutDashboard, Settings, Users, Leaf, ShieldCheck, MapPin, Search } from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "provision">("dashboard");
  const [buildings, setBuildings] = useState<any[]>([]);
  const [regionData, setRegionData] = useState<any>(null);

  // Building Provisioning State
  const [bldgName, setBldgName] = useState("");
  const [bldgCity, setBldgCity] = useState("");
  const [bldgArea, setBldgArea] = useState("12500");
  const [bldgFloors, setBldgFloors] = useState("6");
  const [isEcbcCompliant, setIsEcbcCompliant] = useState(false);
  const [rooms, setRooms] = useState([{ name: "Executive Boardroom", floor: "1", zone: "Meeting" }]);
  const [equipment, setEquipment] = useState([{ name: "Main Chiller", eq_type: "chiller", power_draw_kw: "115" }]);
  const [bLoading, setBLoading] = useState(false);

  // User Registration State
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userFullName, setUserFullName] = useState("");
  const [userRole, setUserRole] = useState("tenant");
  const [buildingSearch, setBuildingSearch] = useState("");
  const [selectedBuildingIds, setSelectedBuildingIds] = useState<string[]>([]);
  const [uLoading, setULoading] = useState(false);

  // Separate Search State for Compliance Table
  const [complianceSearch, setComplianceSearch] = useState("");

  const fetchAllData = async () => {
    try {
      const bData = await apiFetch("/admin/buildings");
      setBuildings(bData || []);
      if (bData?.length > 0 && selectedBuildingIds.length === 0) setSelectedBuildingIds([bData[0].id]);

      const rData = await apiFetch("/admin/region/summary");
      setRegionData(rData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchAllData(); }, []);

  const handleAddBuilding = async (e: React.FormEvent) => {
    e.preventDefault(); setBLoading(true);
    try {
      await apiFetch("/admin/buildings", {
        method: "POST",
        body: JSON.stringify({
          name: bldgName,
          city: bldgCity,
          area_m2: parseInt(bldgArea),
          floors: parseInt(bldgFloors),
          is_ecbc_compliant: isEcbcCompliant,
          rooms,
          equipment
        })
      });
      setBldgName(""); setBldgCity(""); setIsEcbcCompliant(false); await fetchAllData(); alert("Building provisioned successfully!");
    } finally { setBLoading(false); }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault(); setULoading(true);
    try {
      await apiFetch("/admin/users", { method: "POST", body: JSON.stringify({ email: userEmail, password: userPassword, full_name: userFullName, role: userRole, building_ids: selectedBuildingIds }) });
      setUserEmail(""); setUserPassword(""); setUserFullName(""); await fetchAllData(); alert("Account created successfully!");
    } finally { setULoading(false); }
  };

  const handleToggleCompliance = async (buildingId: string, currentStatus: boolean) => {
    try {
      await apiFetch(`/admin/buildings/${buildingId}/compliance`, {
        method: "PATCH",
        body: JSON.stringify({ is_ecbc_compliant: !currentStatus })
      });
      await fetchAllData();
    } catch (err) {
      alert("Failed to update compliance status.");
    }
  };

  const filteredBuildings = buildings.filter(b =>
    b?.name?.toLowerCase().includes(buildingSearch.toLowerCase()) ||
    b?.city?.toLowerCase().includes(buildingSearch.toLowerCase())
  );

  const filteredComplianceBuildings = regionData?.buildings?.filter((b: any) =>
    b?.name?.toLowerCase().includes(complianceSearch.toLowerCase()) ||
    b?.city?.toLowerCase().includes(complianceSearch.toLowerCase())
  ) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 p-4">

      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-emerald-600" /> Platform Administration
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            High-level regional oversight, multi-tenant directory, and asset provisioning.
          </p>
        </div>

        <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
          <button onClick={() => setActiveTab("dashboard")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "dashboard" ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>
            <LayoutDashboard className="w-4 h-4" /> Regional Dashboard
          </button>
          <button onClick={() => setActiveTab("provision")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "provision" ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>
            <Settings className="w-4 h-4" /> Provisioning Tools
          </button>
        </div>
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === "dashboard" && regionData && (
        <div className="space-y-6 animate-in fade-in duration-300">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg"><Building2 className="w-5 h-5" /></div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Facilities</p>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{regionData?.kpis?.total_buildings || 0}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg"><Users className="w-5 h-5" /></div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Tenants</p>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{regionData?.kpis?.total_tenants || 0}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg"><Leaf className="w-5 h-5" /></div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Savings (YTD)</p>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{regionData?.kpis?.regional_savings_kwh?.toLocaleString() || 0} <span className="text-sm font-medium text-slate-400">kWh</span></p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg"><ShieldCheck className="w-5 h-5" /></div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Compliance</p>
              </div>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{regionData?.kpis?.ecbc_compliance_pct || 0}%</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Master Directory</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-900 dark:text-slate-100">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-5 py-3">Building Details</th>
                    <th className="px-5 py-3">Facility Manager</th>
                    <th className="px-5 py-3">Maintenance Team</th>
                    <th className="px-5 py-3">Tenants</th>
                    <th className="px-5 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {regionData?.buildings?.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 align-top">
                        <p className="font-semibold text-slate-900 dark:text-white">{b.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {b.city} {b.area_m2 ? `(${b.area_m2.toLocaleString()} m²)` : ''}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        {b.managers?.length > 0 ? b.managers.map((m: any, i: number) => (
                          <div key={i} className="mb-2 last:mb-0">
                            <p className="font-medium text-sm">{m.name}</p>
                            <p className="text-xs text-slate-500">{m.email}</p>
                          </div>
                        )) : <span className="text-xs text-slate-400 italic">Unassigned</span>}
                      </td>
                      <td className="px-5 py-4 align-top">
                        {b.maintenance?.length > 0 ? b.maintenance.map((m: any, i: number) => (
                          <div key={i} className="mb-2 last:mb-0">
                            <p className="font-medium text-sm">{m.name}</p>
                            <p className="text-xs text-slate-500">{m.email}</p>
                          </div>
                        )) : <span className="text-xs text-slate-400 italic">Unassigned</span>}
                      </td>
                      <td className="px-5 py-4 align-top">
                        {b.tenants?.length > 0 ? (
                          <div className="max-h-24 overflow-y-auto pr-2 custom-scrollbar">
                            {b.tenants.map((t: any, i: number) => (
                              <div key={i} className="mb-2 last:mb-0">
                                <p className="font-medium text-sm">{t.name}</p>
                                <p className="text-xs text-slate-500">{t.email}</p>
                              </div>
                            ))}
                          </div>
                        ) : <span className="text-xs text-slate-400 italic">No Active Tenants</span>}
                      </td>
                      <td className="px-5 py-4 align-top text-right">
                        <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${b.status === "Operational" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400"}`}>
                          {b.status || "Not Operational"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ECBC COMPLIANCE MANAGER TABLE */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm mt-8">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">ECBC Compliance Manager</h2>
                <p className="text-xs text-slate-500 mt-0.5">Toggle and manage energy compliance status across all regional facilities.</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search buildings..."
                  value={complianceSearch}
                  onChange={(e) => setComplianceSearch(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 dark:text-white pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
              <table className="w-full text-left text-sm text-slate-900 dark:text-slate-100">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 sticky top-0">
                  <tr>
                    <th className="px-6 py-3">Building Name</th>
                    <th className="px-6 py-3">City</th>
                    <th className="px-6 py-3">Floor Area</th>
                    <th className="px-6 py-3 text-center">ECBC Certified Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredComplianceBuildings.length > 0 ? (
                    filteredComplianceBuildings.map((b: any) => (
                      <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-emerald-500" /> {b.name}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">{b.city}</td>
                        {/* Dynamic Floor Area from Database */}
                        <td className="px-6 py-4 text-xs font-mono text-slate-500">
                          {b.area_m2 ? `${Number(b.area_m2).toLocaleString()} m²` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <label className="inline-flex items-center gap-3 cursor-pointer bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition">
                            <input
                              type="checkbox"
                              checked={b.ecbc_compliant}
                              onChange={() => handleToggleCompliance(b.id, b.ecbc_compliant)}
                              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                            />
                            <span className={`text-xs font-bold uppercase tracking-wider ${b.ecbc_compliant ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                              {b.ecbc_compliant ? "Compliant" : "Non-Compliant"}
                            </span>
                          </label>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-xs text-slate-400 italic">No matching buildings found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* PROVISIONING TAB */}
      {activeTab === "provision" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-emerald-600" /> Provision New Asset
            </h2>
            <form onSubmit={handleAddBuilding} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Building Name</label>
                <input type="text" required placeholder="e.g. Apex Tech Park" value={bldgName} onChange={(e) => setBldgName(e.target.value)} className="w-full rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 dark:text-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">City</label>
                  <input type="text" required placeholder="Pune" value={bldgCity} onChange={(e) => setBldgCity(e.target.value)} className="w-full rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 dark:text-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Area (m²)</label>
                  <input type="number" required value={bldgArea} onChange={(e) => setBldgArea(e.target.value)} className="w-full rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 dark:text-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Floors</label>
                  <input type="number" required value={bldgFloors} onChange={(e) => setBldgFloors(e.target.value)} className="w-full rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 dark:text-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
              </div>

              <label className="flex items-center gap-3 mt-4 cursor-pointer bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={isEcbcCompliant}
                  onChange={(e) => setIsEcbcCompliant(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 bg-transparent"
                />
                <div>
                  <span className="block text-sm font-bold text-slate-700 dark:text-slate-200">Certify as ECBC Compliant</span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">Applies compliance badge globally. Cannot be auto-inferred.</span>
                </div>
              </label>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Rooms Configuration</label>
                  <button type="button" onClick={() => setRooms([...rooms, { name: "", floor: "1", zone: "Office" }])} className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 hover:underline cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Add Room
                  </button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                  {rooms.map((room, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                      <input type="text" placeholder="Room Name" value={room.name} onChange={(e) => { const r = [...rooms]; r[idx].name = e.target.value; setRooms(r); }} className="flex-1 bg-transparent text-sm dark:text-white focus:outline-none px-1" required />
                      <input type="text" placeholder="Floor" value={room.floor} onChange={(e) => { const r = [...rooms]; r[idx].floor = e.target.value; setRooms(r); }} className="w-16 bg-transparent text-sm dark:text-white focus:outline-none border-l border-slate-300 dark:border-slate-700 pl-2" required />
                      <input type="text" placeholder="Zone" value={room.zone} onChange={(e) => { const r = [...rooms]; r[idx].zone = e.target.value; setRooms(r); }} className="w-20 bg-transparent text-sm dark:text-white focus:outline-none border-l border-slate-300 dark:border-slate-700 pl-2" />
                      {rooms.length > 1 && (
                        <button type="button" onClick={() => setRooms(rooms.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 p-1 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button disabled={bLoading} type="submit" className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-2.5 mt-2 transition-colors cursor-pointer">
                {bLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deploy Building"}
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-emerald-600" /> Register User Account
            </h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input type="text" required placeholder="John Doe" value={userFullName} onChange={(e) => setUserFullName(e.target.value)} className="w-full rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 dark:text-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Role</label>
                  <select value={userRole} onChange={(e) => setUserRole(e.target.value)} className="w-full rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 dark:text-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 cursor-pointer">
                    <option value="tenant">Tenant</option>
                    <option value="facility_manager">Facility Manager</option>
                    <option value="maintenance">Maintenance Team</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                <input type="email" required placeholder="user@demo.com" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className="w-full rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 dark:text-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
                <input type="password" required placeholder="••••••••" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} className="w-full rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 dark:text-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Assign Buildings</label>

                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search buildings..."
                    value={buildingSearch}
                    onChange={(e) => setBuildingSearch(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 dark:text-white pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="max-h-32 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                  {filteredBuildings.length > 0 ? filteredBuildings.map(b => (
                    <label key={b.id} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <input
                        type={userRole === "tenant" ? "radio" : "checkbox"}
                        name="buildingSelection"
                        checked={selectedBuildingIds.includes(b.id)}
                        onChange={() => {
                          if (userRole === "tenant") setSelectedBuildingIds([b.id]);
                          else setSelectedBuildingIds(prev => prev.includes(b.id) ? prev.filter(id => id !== b.id) : [...prev, b.id]);
                        }}
                        className="accent-emerald-600 w-3.5 h-3.5 cursor-pointer"
                      />
                      <div>
                        <span className="block font-medium text-sm text-slate-700 dark:text-slate-300">{b.name}</span>
                      </div>
                    </label>
                  )) : (
                    <p className="text-xs text-slate-500 italic p-2">No buildings found.</p>
                  )}
                </div>
              </div>

              <button disabled={uLoading} type="submit" className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-2.5 mt-2 transition-colors cursor-pointer">
                {uLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}