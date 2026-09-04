const metrics = [
  ["Total students", "1,247", "+4.8% this term"],
  ["Active courses", "24", "6 departments"],
  ["Attendance today", "91.6%", "1,142 marked"],
  ["Fees collected", "UGX 84.2M", "78% of target"],
];

const schedule = [
  ["08:00", "Electrical Engineering", "Dr. Mensah", "Lab 1"],
  ["10:30", "Mechanical Workshop", "Eng. Okafor", "Workshop B"],
  ["13:00", "Computer Science", "Prof. Adeyemi", "Room 204"],
  ["15:30", "Civil Engineering", "Dr. Nkrumah", "Lab 3"],
];

export default function Dashboard() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brandMark">OT</span><div><strong>Olanjay</strong><small>Technical School</small></div></div>
        <nav aria-label="Main navigation">
          {['Overview','Students','Courses','Attendance','Timetable','Examinations','Finance','Reports'].map((item, i) =>
            <a className={i === 0 ? 'active' : ''} href={i === 0 ? '#' : `#${item.toLowerCase()}`} key={item}>{item}</a>
          )}
        </nav>
        <div className="profile"><div className="avatar">KA</div><div><strong>Kolapo Adedipe</strong><small>Administrator</small></div></div>
      </aside>
      <main>
        <header><div><p className="eyebrow">ACADEMIC YEAR 2026/2027</p><h1>Good morning, Admin</h1><p>Here is today’s academic and operational overview.</p></div><button className="primary">Mark attendance</button></header>
        <section className="metrics" aria-label="School metrics">
          {metrics.map(([label,value,note]) => <article className="metric" key={label}><p>{label}</p><strong>{value}</strong><small>{note}</small></article>)}
        </section>
        <section className="grid">
          <article className="panel schedule"><div className="panelHead"><div><p className="eyebrow">THURSDAY, 4 SEPTEMBER</p><h2>Today’s schedule</h2></div><button className="linkButton">View timetable</button></div>
            <div className="scheduleList">{schedule.map(([time,course,teacher,room]) => <div className="scheduleRow" key={time}><time>{time}</time><div><strong>{course}</strong><span>{teacher}</span></div><span className="room">{room}</span></div>)}</div>
          </article>
          <article className="panel"><div className="panelHead"><div><p className="eyebrow">FINANCE</p><h2>Fee collection</h2></div></div>
            <div className="donut"><div><strong>78%</strong><span>collected</span></div></div>
            <div className="legend"><span><i className="paid"/>Paid UGX 84.2M</span><span><i/>Outstanding UGX 23.7M</span></div>
          </article>
          <article className="panel activity"><div className="panelHead"><div><p className="eyebrow">LIVE UPDATES</p><h2>Recent activity</h2></div><button className="linkButton">View all</button></div>
            {[['New student enrolled','Amara Okafor · Computer Science','2 hours ago'],['Results published','Electrical Systems · Semester 2','Yesterday'],['Payment confirmed','INV-2026-01842 · UGX 850,000','Yesterday']].map(([title,detail,time])=><div className="activityRow" key={title}><span className="dot"/><div><strong>{title}</strong><p>{detail}</p></div><time>{time}</time></div>)}
          </article>
        </section>
      </main>
    </div>
  );
}
