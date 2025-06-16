import React, { useState, useEffect } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api/",
  headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
});

function GuardDashboard() {
  const [schedule, setSchedule] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(()=>{
    api.get("guards/dashboard/").then(res=>setSchedule(res.data.schedule));
  },[]);

  const uploadAttendance = async () => {
    const data = new FormData();
    data.append("face_image", photo);
    try {
      await api.post("logs/attendance/", data);
      setMsg("Attendance recorded!");
    } catch (e) {
      setMsg("Error uploading attendance");
    }
  };

  return (
    <div>
      <h2>Guard Dashboard</h2>
      <h3>Schedule</h3>
      <ul>
        {schedule.map(s=>(<li key={s.id}>{s.date} {s.shift_time}</li>))}
      </ul>
      <input type="file" accept="image/*" onChange={e=>setPhoto(e.target.files[0])} />
      <button onClick={uploadAttendance}>Upload Attendance (Face Scan)</button>
      {msg && <div>{msg}</div>}
    </div>
  );
}
export default GuardDashboard;
