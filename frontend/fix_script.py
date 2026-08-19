import sys

try:
    with open('src/pages/ManagerDashboard.jsx', 'r', encoding='utf-8') as f:
        content = f.read()
except Exception as e:
    print(e)
    sys.exit(1)

with open('fix_components.py', 'r', encoding='utf-8') as f:
    py_content = f.read()

live_rep = py_content.split('live_attendance_replacement = r"""')[1].split('"""')[0]
stud_rep = py_content.split('student_management_replacement = r"""')[1].split('"""')[0]

s1 = content.find('// ─── LIVE ATTENDANCE & QR SCANNER')
e1 = content.find('// ─── AI FORECASTING')
s2 = content.find('// ─── STUDENT MANAGEMENT')
e2 = content.find('// ─── MAIN ROUTER')

if s1 == -1 or e1 == -1 or s2 == -1 or e2 == -1:
    print("Error finding boundaries", s1, e1, s2, e2)
    sys.exit(1)

new_content = content[:s1] + live_rep + "\n\n" + content[e1:s2] + stud_rep + "\n\n" + content[e2:]

with open('src/pages/ManagerDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully updated ManagerDashboard.jsx")
