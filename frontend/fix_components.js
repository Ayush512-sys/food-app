const fs = require('fs');

let content = fs.readFileSync('src/pages/ManagerDashboard.jsx', 'utf8');

// The replacement LiveAttendance string
const liveAttendanceReplacement = `// ─── LIVE ATTENDANCE & QR SCANNER ──────────────────────────────────────────────
const LiveAttendance = () => {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [qrRoll, setQrRoll] = useState('');
  const [qrMeal, setQrMeal] = useState('Lunch');
  const [scanMsg, setScanMsg] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [historyModal, setHistoryModal] = useState({ isOpen: false, student: null, month: getToday().substring(0, 7), data: null, stats: null });
  const [showScanner, setShowScanner] = useState(false);
  const [cameraError, setCameraError] = useState('');
  
  const socket = useSocket();

  const fetchData = async () => {
    try {
      const sRes = await api.get(\`/api/attendance/live?date=\${selectedDate}\`);
      setStats(sRes.data.stats);
      const qRes = await api.get(\`/api/attendance/logs?date=\${selectedDate}\`);
      setLogs(qRes.data.data);
    } catch {}
  };

  useEffect(() => { fetchData(); }, [selectedDate]);

  useEffect(() => {
    if (socket) socket.on('attendance_updated', () => fetchData());
    return () => { if (socket) socket.off('attendance_updated'); };
  }, [socket, selectedDate]);

  const fetchHistory = async (studentId, month) => {
    try {
      const res = await api.get(\`/api/attendance/student/\${studentId}/monthly?month=\${month}\`);
      setHistoryModal(prev => ({ ...prev, data: res.data.data, stats: res.data.stats }));
    } catch (err) { console.error(err); }
  };

  const openHistory = (student) => {
    const defaultMonth = getToday().substring(0, 7);
    setHistoryModal({ isOpen: true, student, month: defaultMonth, data: null, stats: null });
    fetchHistory(student._id || student.id, defaultMonth);
  };

  const handleScan = async (scannedRoll) => {
    if (!scannedRoll) return;
    try {
      const res = await api.patch('/api/attendance/scan', { rollNumber: scannedRoll, mealType: qrMeal, date: selectedDate });
      setScanMsg({ type: res.data.data?.correctedFromAbsent || res.data.corrected ? 'warning' : 'success', text: res.data.message });
      setQrRoll('');
      fetchData();
    } catch (err) {
      setScanMsg({ type: 'error', text: err.response?.data?.message || 'Scan failed' });
    }
  };

  const handleDeleteLog = async (id) => {
    if (!window.confirm("Delete this scan log?")) return;
    try {
      await api.delete(\`/api/attendance/logs/\${id}\`);
      fetchData();
    } catch (err) { alert('Failed to delete log'); }
  };

  const MealStat = ({ label, data }) => (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 text-center">
      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">{label}</p>
      <div className="flex justify-center gap-4">
        <div><p className="text-lg font-extrabold text-emerald-500">{data?.present || 0}</p><p className="text-[9px] text-slate-400 uppercase">Present</p></div>
        <div><p className="text-lg font-extrabold text-red-500">{data?.absent || 0}</p><p className="text-[9px] text-slate-400 uppercase">Absent</p></div>
        <div><p className="text-lg font-extrabold text-amber-500">{data?.corrected || 0}</p><p className="text-[9px] text-slate-400 uppercase">Corrected</p></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Users size={16} className="text-amber-500" /> Live Meal Stats
            </h3>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-white"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <MealStat label="Breakfast" data={stats?.breakfast} />
            <MealStat label="Lunch" data={stats?.lunch} />
            <MealStat label="Dinner" data={stats?.dinner} />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Camera size={16} className="text-amber-500" /> QR Code Scanner
          </h3>
          <div className="space-y-4">
            <select value={qrMeal} onChange={e=>setQrMeal(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs">
              <option>Breakfast</option><option>Lunch</option><option>Dinner</option>
            </select>
            
            {!showScanner ? (
              <div className="space-y-3">
                <button onClick={() => { setShowScanner(true); setCameraError(''); }} className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex justify-center items-center gap-2">
                  <Camera size={14} /> Open Mobile Camera
                </button>
                <div className="flex items-center gap-2">
                  <input type="text" value={qrRoll} onChange={e=>setQrRoll(e.target.value)} placeholder="Or manual roll number" className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs" />
                  <button onClick={() => handleScan(qrRoll)} className="py-2 px-4 bg-slate-800 text-white font-bold rounded-xl text-xs hover:bg-slate-700">Submit</button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 rounded-xl overflow-hidden relative">
                <Scanner 
                  onScan={(detectedCodes) => { if (detectedCodes && detectedCodes.length > 0) handleScan(detectedCodes[0].rawValue); }} 
                  onError={(error) => { console.error(error); setCameraError(error?.message || 'Failed to open camera'); }}
                  allowMultiple={false}
                />
                <button onClick={() => setShowScanner(false)} className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/80 text-white rounded-lg z-10">
                  <X size={16} />
                </button>
              </div>
            )}
            
            {cameraError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs">{cameraError}. Are you using https:// ?</div>}
            {scanMsg && <p className={`text-[11px] font-bold p-2 rounded-lg text-center ${scanMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : scanMsg.type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>{scanMsg.text}</p>}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
          <History size={16} className="text-amber-500" /> Recent Scan Logs
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                <th className="pb-3 pl-2">Time</th>
                <th className="pb-3">Student</th>
                <th className="pb-3">Meal</th>
                <th className="pb-3">Status</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((l, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 pl-2 text-slate-600 dark:text-slate-400">{new Date(l.scanTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                  <td className="py-3"><p className="font-bold text-slate-800 dark:text-white">{l.student?.name}</p><p className="text-[10px] text-slate-400">{l.student?.rollNumber}</p></td>
                  <td className="py-3 text-slate-600 dark:text-slate-400">{l.mealType}</td>
                  <td className="py-3"><span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[9px] font-bold">Logged</span></td>
                  <td className="py-3 pr-2 text-right">
                    <button onClick={() => openHistory(l.student)} className="text-slate-400 hover:text-indigo-500 p-1 mr-2" title="View History"><Calendar size={14} /></button>
                    <button onClick={() => handleDeleteLog(l._id)} className="text-slate-400 hover:text-red-500 p-1" title="Delete Log"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan="5" className="py-4 text-center text-slate-400">No scans yet today.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {historyModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full p-6 border-slate-700 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Attendance History</h2>
                <p className="text-xs text-slate-500">{historyModal.student?.name} ({historyModal.student?.rollNumber})</p>
              </div>
              <div className="flex items-center gap-4">
                <input type="month" value={historyModal.month} onChange={(e) => fetchHistory(historyModal.student?._id || historyModal.student?.id, e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-white" />
                <button onClick={() => setHistoryModal({ isOpen: false, student: null, month: getToday().substring(0, 7), data: null, stats: null })} className="text-slate-400 hover:text-white"><X size={20} /></button>
              </div>
            </div>
            
            {historyModal.stats && (
              <div className="grid grid-cols-3 gap-4 mb-6 shrink-0">
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 mb-1">Breakfast</p>
                  <p className="text-lg font-bold text-emerald-500">{historyModal.stats.breakfast.present}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 mb-1">Lunch</p>
                  <p className="text-lg font-bold text-emerald-500">{historyModal.stats.lunch.present}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 mb-1">Dinner</p>
                  <p className="text-lg font-bold text-emerald-500">{historyModal.stats.dinner.present}</p>
                </div>
              </div>
            )}

            <div className="overflow-y-auto flex-1 pr-2">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 bg-white dark:bg-slate-950 z-10">
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                    <th className="pb-2 pt-1 pl-2">Date</th>
                    <th className="pb-2 pt-1 text-center">Breakfast</th>
                    <th className="pb-2 pt-1 text-center">Lunch</th>
                    <th className="pb-2 pt-1 text-center">Dinner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {historyModal.data && historyModal.data.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2 pl-2 text-slate-600 dark:text-slate-400 font-medium">{new Date(r.date).toLocaleDateString()}</td>
                      <td className="py-2 text-center"><span className={`\px-2 py-1 rounded-full text-[9px] font-bold \${r.breakfast==='Present'?'bg-emerald-500/10 text-emerald-500':r.breakfast==='Corrected'?'bg-amber-500/10 text-amber-500':'bg-red-500/10 text-red-500'}\`}>{r.breakfast}</span></td>
                      <td className="py-2 text-center"><span className={`\px-2 py-1 rounded-full text-[9px] font-bold \${r.lunch==='Present'?'bg-emerald-500/10 text-emerald-500':r.lunch==='Corrected'?'bg-amber-500/10 text-amber-500':'bg-red-500/10 text-red-500'}\`}>{r.lunch}</span></td>
                      <td className="py-2 text-center"><span className={`\px-2 py-1 rounded-full text-[9px] font-bold \${r.dinner==='Present'?'bg-emerald-500/10 text-emerald-500':r.dinner==='Corrected'?'bg-amber-500/10 text-amber-500':'bg-red-500/10 text-red-500'}\`}>{r.dinner}</span></td>
                    </tr>
                  ))}
                  {historyModal.data?.length === 0 && <tr><td colSpan="4" className="py-4 text-center text-slate-400">No records found for this month.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
`;

const studentManagementReplacement = `// ─── STUDENT MANAGEMENT ────────────────────────────────────────────────────────
const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [addStudentModal, setAddStudentModal] = useState(false);
  const [editStudentModal, setEditStudentModal] = useState(null);
  const [editDatesModal, setEditDatesModal] = useState({ isOpen: false, student: null, start: '', end: '' });
  const [newStudent, setNewStudent] = useState({ name: '', email: '', rollNumber: '', password: '', roomNumber: '', contact: '' });
  const [editStudentData, setEditStudentData] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getToday());

  const fetchStudents = async () => {
    try {
      const lRes = await api.get(\`/api/attendance/students-list?date=\${selectedDate}\`);
      setStudents(lRes.data.data);
    } catch {}
  };

  useEffect(() => { fetchStudents(); }, [selectedDate]);

  const handleOverride = async (studentId, mealType, currentStatus) => {
    const newStatus = currentStatus === 'Present' ? 'Absent' : 'Present';
    try {
      await api.put('/api/attendance/override', { studentId, date: selectedDate, mealType, status: newStatus });
      fetchStudents();
    } catch (err) { alert('Failed to override attendance'); }
  };

  const handleEditDatesClick = (student) => {
    setEditDatesModal({
      isOpen: true,
      student,
      start: student.subscriptionStart ? student.subscriptionStart.split('T')[0] : '',
      end: student.subscriptionEnd ? student.subscriptionEnd.split('T')[0] : ''
    });
  };

  const handleUpdateDates = async (e) => {
    e.preventDefault();
    try {
      await api.put(\`/api/managers/students/\${editDatesModal.student._id || editDatesModal.student.id}/subscription\`, { 
        subscriptionStart: editDatesModal.start, 
        subscriptionEnd: editDatesModal.end 
      });
      setEditDatesModal({ isOpen: false, student: null, start: '', end: '' });
      fetchStudents();
      alert('Dates updated successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update dates');
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/managers/students', newStudent);
      setAddStudentModal(false);
      setNewStudent({ name: '', email: '', rollNumber: '', password: '', roomNumber: '', contact: '' });
      fetchStudents();
      alert('Student added successfully! They can now log in.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add student. Please check details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(\`Are you sure you want to completely remove \${name} from this hostel? This action cannot be undone.\`)) return;
    try {
      await api.delete(\`/api/managers/students/\${id}\`);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove student');
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(\`/api/managers/students/\${editStudentModal}\`, editStudentData);
      setEditStudentModal(null);
      setEditStudentData({});
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Manage Students</h3>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-white"
            />
          </div>
          <button onClick={() => setAddStudentModal(true)} className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] transition-all flex items-center gap-1 shadow-lg shadow-amber-500/20">
            + Add New Student
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                <th className="pb-3 pl-2">Name / Roll</th>
                <th className="pb-3">Room / Contact</th>
                <th className="pb-3">Breakfast</th>
                <th className="pb-3">Lunch</th>
                <th className="pb-3">Dinner</th>
                <th className="pb-3">Join Date</th>
                <th className="pb-3">End Date</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {students.map((s, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 pl-2"><p className="font-bold text-slate-800 dark:text-white">{s.name}</p><p className="text-[10px] text-slate-400">{s.rollNumber}</p></td>
                  <td className="py-3 text-slate-600 dark:text-slate-400">
                    <p>{s.roomNumber}</p>
                    <p className="text-[10px] text-slate-400">{s.contact}</p>
                  </td>
                  <td className="py-3">
                    <button 
                      onClick={() => handleOverride(s._id || s.id, 'Breakfast', s.attendance?.breakfast || 'Present')}
                      className={\`px-2 py-1 rounded-full text-[9px] font-bold transition-all hover:opacity-80 \${(s.attendance?.breakfast || 'Present') === 'Present' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}\`}>
                      {s.attendance?.breakfast || 'Present'}
                    </button>
                  </td>
                  <td className="py-3">
                    <button 
                      onClick={() => handleOverride(s._id || s.id, 'Lunch', s.attendance?.lunch || 'Present')}
                      className={\`px-2 py-1 rounded-full text-[9px] font-bold transition-all hover:opacity-80 \${(s.attendance?.lunch || 'Present') === 'Present' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}\`}>
                      {s.attendance?.lunch || 'Present'}
                    </button>
                  </td>
                  <td className="py-3">
                    <button 
                      onClick={() => handleOverride(s._id || s.id, 'Dinner', s.attendance?.dinner || 'Present')}
                      className={\`px-2 py-1 rounded-full text-[9px] font-bold transition-all hover:opacity-80 \${(s.attendance?.dinner || 'Present') === 'Present' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}\`}>
                      {s.attendance?.dinner || 'Present'}
                    </button>
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-400 text-[10px]">{s.subscriptionStart ? new Date(s.subscriptionStart).toLocaleDateString() : 'N/A'}</td>
                  <td className="py-3 text-slate-600 dark:text-slate-400 text-[10px]">{s.subscriptionEnd ? new Date(s.subscriptionEnd).toLocaleDateString() : 'N/A'}</td>
                  <td className="py-3 pr-2 text-right whitespace-nowrap">
                    <button onClick={() => {
                      setEditStudentModal(s._id || s.id);
                      setEditStudentData({ name: s.name, email: s.email, rollNumber: s.rollNumber, roomNumber: s.roomNumber, contact: s.contact });
                    }} className="text-slate-400 hover:text-indigo-500 transition-colors p-1 mr-1" title="Edit Student Profile">
                      <UserCog size={14} />
                    </button>
                    <button onClick={() => handleEditDatesClick(s)} className="text-slate-400 hover:text-amber-500 transition-colors p-1 mr-1" title="Edit Subscription Dates">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDeleteStudent(s._id || s.id, s.name)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Remove Student">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Student Modal */}
      {addStudentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-6 border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Add New Student</h2>
              <button onClick={() => setAddStudentModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Full Name</label>
                <input type="text" required value={newStudent.name} onChange={e=>setNewStudent({...newStudent, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Roll Number</label>
                  <input type="text" required value={newStudent.rollNumber} onChange={e=>setNewStudent({...newStudent, rollNumber: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Room Number</label>
                  <input type="text" required value={newStudent.roomNumber} onChange={e=>setNewStudent({...newStudent, roomNumber: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Email</label>
                <input type="email" required value={newStudent.email} onChange={e=>setNewStudent({...newStudent, email: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Contact Number</label>
                <input type="text" required value={newStudent.contact} onChange={e=>setNewStudent({...newStudent, contact: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Password (Minimum 6 Characters)</label>
                <input type="password" required minLength={6} value={newStudent.password} onChange={e=>setNewStudent({...newStudent, password: e.target.value})} placeholder="e.g., password123" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all mt-6 disabled:opacity-50">
                {loading ? 'Adding...' : 'Add Student'}
              </button>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Dates Modal */}
      {editDatesModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-6 border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Edit Subscription Dates</h2>
              <button onClick={() => setEditDatesModal({ isOpen: false, student: null, start: '', end: '' })} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Editing dates for <span className="font-bold text-slate-800 dark:text-white">{editDatesModal.student?.name}</span></p>
            <form onSubmit={handleUpdateDates} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Start Date</label>
                <input type="date" required value={editDatesModal.start} onChange={e=>setEditDatesModal({...editDatesModal, start: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">End Date</label>
                <input type="date" required value={editDatesModal.end} onChange={e=>setEditDatesModal({...editDatesModal, end: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all mt-6">
                Update Dates
              </button>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Student Modal */}
      {editStudentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-6 border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Edit Student Profile</h2>
              <button onClick={() => setEditStudentModal(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Full Name</label>
                <input type="text" required value={editStudentData.name} onChange={e=>setEditStudentData({...editStudentData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Roll Number</label>
                  <input type="text" required value={editStudentData.rollNumber} onChange={e=>setEditStudentData({...editStudentData, rollNumber: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Room Number</label>
                  <input type="text" required value={editStudentData.roomNumber} onChange={e=>setEditStudentData({...editStudentData, roomNumber: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Email</label>
                <input type="email" required value={editStudentData.email} onChange={e=>setEditStudentData({...editStudentData, email: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Contact Number</label>
                <input type="text" required value={editStudentData.contact} onChange={e=>setEditStudentData({...editStudentData, contact: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all mt-6 disabled:opacity-50">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
`;

const lines = content.split('\n');
const s1 = lines.findIndex(l => l.includes('// ─── LIVE ATTENDANCE & QR SCANNER'));
const e1 = lines.findIndex((l, i) => i > s1 && l.includes('// ─── FORECASTING'));

const s2 = lines.findIndex(l => l.includes('// ─── STUDENT MANAGEMENT'));
const e2 = lines.findIndex((l, i) => i > s2 && l.includes('// ─── MAIN ROUTER'));

if (s1 === -1 || e1 === -1 || s2 === -1 || e2 === -1) {
  console.log('Error finding boundaries', s1, e1, s2, e2);
  process.exit(1);
}

const p1 = lines.slice(0, s1).join('\n');
const p2 = lines.slice(e1, s2).join('\n');
const p3 = lines.slice(e2).join('\n');

const newContent = p1 + '\n' + liveAttendanceReplacement + '\n' + p2 + '\n' + studentManagementReplacement + '\n' + p3;
fs.writeFileSync('src/pages/ManagerDashboard.jsx', newContent);
console.log('Successfully patched ManagerDashboard.jsx');
