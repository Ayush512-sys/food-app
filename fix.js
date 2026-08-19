const fs = require('fs');

function fixAuth() {
  let code = fs.readFileSync('backend/routes/auth.js', 'utf8');
  code = code.replace(
    'const { role, password } = req.body;',
    'const { role, password } = req.body;\n    let emailOrRoll = req.body.emailOrRoll?.trim();\n    let managerId = req.body.managerId?.trim();\n    let email = req.body.email?.trim();'
  );
  code = code.replace(
    'const { emailOrRoll } = req.body;',
    '// emailOrRoll already extracted and trimmed'
  );
  code = code.replace(
    'const { managerId } = req.body;',
    '// managerId already extracted and trimmed'
  );
  code = code.replace(
    '      const { email } = req.body;',
    '      // email already extracted and trimmed'
  );
  fs.writeFileSync('backend/routes/auth.js', code);
}

function fixAttendance() {
  let code = fs.readFileSync('backend/routes/attendance.js', 'utf8');
  code = code.replace(
    'const { rollNumber, mealType, date } = req.body;',
    'let { rollNumber, mealType, date } = req.body;\n    if(rollNumber) rollNumber = rollNumber.trim();'
  );
  fs.writeFileSync('backend/routes/attendance.js', code);
}

fixAuth();
fixAttendance();
console.log('Fixed');
