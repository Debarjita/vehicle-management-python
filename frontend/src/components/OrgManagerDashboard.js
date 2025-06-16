import React, { useState, useEffect } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api/",
  headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
});

function OrgManagerDashboard() {
 // const [guards, setGuards] = useState([]);
 // const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [unassignedVehicles, setUnassignedVehicles] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("GUARD");
  const [assignDriverId, setAssignDriverId] = useState("");
  const [assignVehicleId, setAssignVehicleId] = useState("");
  const [msg, setMsg] = useState("");

  // Load available vehicles, guards, drivers
  useEffect(() => {
    async function fetchData() {
      const vehRes = await api.get("vehicles/unassigned/"); // adjust if different
      setUnassignedVehicles(vehRes.data);
      const myVeh = await api.get("vehicles/");
      setVehicles(myVeh.data);
      // Optionally: fetch guards & drivers
    }
    fetchData();
  }, []);

  const createUser = async () => {
    try {
      await api.post("users/create_guard_or_driver/", {
        username, password, role
      });
      setMsg("User created!");
    } catch (e) {
      setMsg("Error creating user");
    }
  };

  const claimVehicle = async (vehicleId) => {
    try {
      await api.post("vehicles/claim/", { vehicle_id: vehicleId });
      setMsg("Vehicle claimed!");
    } catch (e) {
      setMsg("Error claiming vehicle");
    }
  };

  const assignDriver = async () => {
    try {
      await api.post("vehicles/assign_driver/", {
        vehicle_id: assignVehicleId,
        driver_id: assignDriverId
      });
      setMsg("Driver assigned!");
    } catch (e) {
      setMsg("Error assigning driver");
    }
  };

  const generateSchedule = async () => {
    try {
      await api.post("schedules/generate/");
      setMsg("Schedule generated!");
    } catch (e) {
      setMsg("Error generating schedule");
    }
  };

  return (
    <div>
      <h2>Org Manager Dashboard</h2>
      <div>
        <h3>Create Guard/Driver</h3>
        <input placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} />
        <input placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <select value={role} onChange={e=>setRole(e.target.value)}>
          <option value="GUARD">Guard</option>
          <option value="DRIVER">Driver</option>
        </select>
        <button onClick={createUser}>Create</button>
      </div>
      <div>
        <h3>Claim Vehicle</h3>
        {unassignedVehicles.map(v=>(
          <div key={v.id}>{v.number_plate}
            <button onClick={()=>claimVehicle(v.id)}>Claim</button>
          </div>
        ))}
      </div>
      <div>
        <h3>Assign Driver to Vehicle</h3>
        <input placeholder="Vehicle ID" value={assignVehicleId} onChange={e=>setAssignVehicleId(e.target.value)} />
        <input placeholder="Driver ID" value={assignDriverId} onChange={e=>setAssignDriverId(e.target.value)} />
        <button onClick={assignDriver}>Assign</button>
      </div>
      <div>
        <h3>Generate Schedule</h3>
        <button onClick={generateSchedule}>Generate</button>
      </div>
      <div>
        <h3>Vehicles</h3>
        {vehicles.map(v=>(<div key={v.id}>{v.number_plate} - Driver: {v.assigned_driver}</div>))}
      </div>
      {msg && <div>{msg}</div>}
    </div>
  );
}
export default OrgManagerDashboard;
