// server.js
;


if (!found) return res.status(404).json({ error: 'ไม่พบข้อมูลที่ต้องการ' });


fs.writeFile(planPath, JSON.stringify(plan, null, 2), err => {
if (err) return res.status(500).json({ error: 'บันทึกไม่สำเร็จ' });
res.json({ ok: true, message: 'บันทึกสำเร็จ' });
});
;


// POST /submit-inspection
// multipart form: any fields from the form; files: inspection_photos (array), speedtest_photo (single)
app.post('/submit-inspection', upload.fields([
{ name: 'inspection_photos', maxCount: 10 },
{ name: 'speedtest_photo', maxCount: 1 }
]), (req, res) => {
const body = req.body || {};
const files = req.files || {};
const submission = {
timestamp: new Date().toISOString(),
data: body,
files: {
inspection_photos: (files['inspection_photos'] || []).map(f => path.join('uploads', path.basename(f.path))),
speedtest_photo: (files['speedtest_photo'] || []).map(f => path.join('uploads', path.basename(f.path)))
}
};


const submissionsPath = path.join(PUBLIC_DIR, 'inspection_submissions.json');
let submissions = [];
if (fs.existsSync(submissionsPath)) {
try { submissions = JSON.parse(fs.readFileSync(submissionsPath, 'utf8')); } catch (e) { submissions = []; }
}
submissions.push(submission);
fs.writeFile(submissionsPath, JSON.stringify(submissions, null, 2), err => {
if (err) return res.status(500).json({ error: 'ไม่สามารถบันทึก submission' });


// Optional: update inspection_plan.json status if location/month/week provided
if (body.location && body.month && body.week) {
const planPath = path.join(PUBLIC_DIR, 'inspection_plan.json');
try {
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
plan.forEach(item => {
if (item.location === body.location || item.location.includes(body.location)) {
item.inspections.forEach(i => {
if (i.month === body.month && i.week === parseInt(body.week)) i.status = 'ตรวจแล้ว';
});
}
});
fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
} catch (e) {
// ignore plan update errors
}
}


res.json({ ok: true, message: 'ส่งข้อมูลเรียบร้อย', submission });
});
});


app.listen(PORT, () => {
console.log(`Server running at http://localhost:${PORT}`);
});