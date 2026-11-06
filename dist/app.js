let state;
try {
	state = JSON.parse(localStorage.getItem('istqb-lab'))
} catch {}
state = state || {
	done: [],
	wrong: [],
	attempts: [],
	reviews: {},
	known: [],
	flashReviews: {}
};
state.flashReviews ||= {};
const $ = s => document.querySelector(s),
	save = () => localStorage.setItem('istqb-lab', JSON.stringify(state));
const nav = [
	['home', '◫', 'Tổng quan'],
	['roadmap', '▤', 'Lộ trình học'],
	['practice', '◎', 'Luyện theo chủ đề'],
	['exam', '◷', 'Đề mô phỏng'],
	['flash', '▱', 'Flashcards'],
	['review', '↺', 'Ôn tập & câu sai'],
	['stats', '▥', 'Kết quả học tập'],
	['settings', '⚙', 'Nguồn & dữ liệu']
];
const total = chapters.reduce((a, c) => a + c.topics.length, 0);
let quiz = null,
	flashIndex = 0,
	flipped = false,
	flashPool = terms.map((_, i) => i),
	timer;

function esc(s) {
	return String(s).replace(/[&<>"']/g, c => ({
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;'
	} [c]))
}

function toast(s) {
	let el = document.createElement('div');
	el.className = 'toast';
	el.textContent = s;
	document.body.append(el);
	setTimeout(() => el.remove(), 3000)
}

function heading(label, title, sub) {
	return `<div class="eyebrow">${label}</div><h1>${title}</h1><p>${sub}</p>`
}

function progress(c) {
	return chapters[c].topics.filter((_, t) => state.done.includes(`${c}-${t}`)).length
}

function chapterRows() {
	return chapters.map((c, i) => `<a class="chap" href="#chapter/${i}" style="text-decoration:none;color:inherit"><span class="num">0${i+1}</span><div class="info"><h3>${c.title}</h3><p>${c.topics.length} bài học &nbsp; · &nbsp; ${c.min} phút syllabus &nbsp; · &nbsp; ${c.weight} câu trong đề</p><div class="track"><i style="width:${progress(i)/c.topics.length*100}%"></i></div></div><span class="pill">${progress(i)}/${c.topics.length}</span><span class="arrow">›</span></a>`).join('')
}

function due() {
	return state.wrong.filter(id => !state.reviews[id] || state.reviews[id].due <= Date.now())
}

function average() {
	let a = state.attempts;
	return a.length ? Math.round(a.reduce((s, x) => s + x.score / x.total * 100, 0) / a.length) : 0
}

function recent() {
	return state.attempts.length ? state.attempts.slice(-4).reverse().map(a => `<div class="row" style="padding:12px 0;border-bottom:1px solid var(--line)"><span>${esc(a.name)}<br><small>${new Date(a.at).toLocaleDateString('vi')}</small></span><b>${a.score}/${a.total}</b></div>`).join('') : '<p class="empty">Chưa có lượt luyện tập.<br>Kết quả đầu tiên sẽ xuất hiện tại đây.</p>'
}

function render() {
	clearInterval(timer);
	let [page, arg] = location.hash.slice(1).split('/');
	page ||= 'home';
	$('#nav').innerHTML = nav.map(([id, ic, tx]) => `<a class="${page===id||(page==='chapter'&&id==='roadmap')?'active':''}" href="#${id}"><span>${ic}</span>${tx}</a>`).join('');
	$('#crumb').textContent = 'Không gian học tập / ' + (nav.find(n => n[0] === page)?.[2] || 'Bài học');
	let html = '';
	if (page === 'home') {
		html = `<div class="topline"><div>${heading('MỖI NGÀY MỘT BƯỚC TIẾN','Chào anh Tim, cùng học nhé 👋','Xây nền tảng kiểm thử vững vàng. Sẵn sàng cho kỳ thi ISTQB.')}</div><span class="badge">● Syllabus v4.0.1</span></div><div class="hero"><div class="herotext"><div class="eyebrow">LỘ TRÌNH FOUNDATION LEVEL</div><h2>Học vững nền tảng.<br>Tự tin bước vào kỳ thi.</h2><p>6 chương, những ví dụ gần gũi và câu hỏi có giải thích.<br>Đi từng bước nhỏ, hiểu sâu thay vì học thuộc.</p><button onclick="continueStudy()">${state.done.length?'Tiếp tục học':'Bắt đầu hành trình'} &nbsp; →</button></div><div class="art"><div class="orbit"><div class="book">ISTQB<small>FOUNDATION LEVEL</small><div style="font-size:18px;margin-top:20px">✓ &nbsp; 4.0.1</div></div></div></div></div><div class="stats"><div class="stat"><label>◫ &nbsp; Tiến độ học tập</label><strong>${Math.round(state.done.length/total*100)}<small>%</small></strong><small>${state.done.length}/${total} bài đã hoàn thành</small></div><div class="stat"><label>◎ &nbsp; Điểm trung bình</label><strong>${state.attempts.length?average():'—'}<small>${state.attempts.length?'%':''}</small></strong><small>${state.attempts.length} lượt luyện đã hoàn tất</small></div><div class="stat"><label>↺ &nbsp; Cần ôn hôm nay</label><strong>${due().length}</strong><small>Câu sai đến lịch ôn lại</small></div><div class="stat"><label>▱ &nbsp; Thuật ngữ đã nhớ</label><strong>${state.known.length}<small> / ${terms.length}</small></strong><small>Ôn một chút mỗi ngày</small></div></div><div class="layout"><section><div class="sectionhead"><h2>Lộ trình của anh</h2><a class="link" href="#roadmap">Xem tất cả →</a></div>${chapterRows()}</section><section><div class="sectionhead"><h2>Góc ôn tập</h2></div><div class="card"><span class="eyebrow">SẴN SÀNG THỬ SỨC?</span><h2>Một bước gần hơn<br>đến chứng chỉ</h2><p style="font-size:12px">40 câu hỏi · 60 phút<br>Đạt từ 26/40 điểm (65%)</p><a class="button" href="#exam">Làm đề mô phỏng &nbsp; ↗</a></div><div class="card tip"><h3>✦ Học hiểu, nhớ lâu</h3><p>Phân biệt confirmation và regression bằng mục tiêu: xác nhận lỗi đã sửa, hay tìm tác dụng phụ?</p><a href="#flash" class="link">Ôn flashcards →</a></div><h3 style="margin-top:25px">Hoạt động gần đây</h3><div class="card">${recent()}</div></section></div>`
	}
	if (page === 'roadmap') html = heading('LỘ TRÌNH 6 CHƯƠNG', 'Từ nền tảng đến thực hành', 'Học theo thứ tự hoặc chọn chương anh cần củng cố. Thời lượng là phân bổ tối thiểu trong syllabus, không phải thời gian bắt buộc tự học.') + chapterRows();
	if (page === 'chapter') {
		let c = +arg;
		if (!chapters[c]) c = 0;
		let ch = chapters[c];
		html = heading(`CHƯƠNG 0${c+1} · ${ch.en}`, ch.title, `${ch.min} phút syllabus · ${ch.weight} câu trong đề · ${progress(c)}/${ch.topics.length} bài đã học`) + ch.topics.map((t, i) => `<article class="card lesson" style="margin:18px 0"><div class="row"><span class="eyebrow">${c+1}.${i+1} · BÀI TỔNG HỢP</span><button class="secondary" onclick="mark('${c}-${i}')">${state.done.includes(`${c}-${i}`)?'✓ Đã học':'Đánh dấu đã học'}</button></div><h2>${t[0]}</h2><p>${t[1]}</p><div class="example"><b>Ví dụ thực tế</b><p>${t[2]}</p></div><p><b>Tự kiểm tra:</b> Anh hãy giải thích khái niệm này bằng một ví dụ trong dự án của mình, rồi so sánh với khái niệm dễ nhầm ở bài.</p><button class="secondary" onclick="startQuiz('topic',${c},${i})">Luyện câu hỏi bài này →</button></article>`).join('') + `<button onclick="startQuiz('chapter',${c})">Luyện toàn chương</button><p class="notice">Các bài là phần giải thích tổng hợp theo chủ đề, không thay thế toàn bộ learning objectives trong syllabus. Đọc thêm syllabus chính thức trong mục Nguồn & dữ liệu.</p>`
	}
	if (page === 'practice') html = heading('LUYỆN TẬP CHỦ ĐỘNG', 'Hiểu đúng, rồi nhớ lâu', 'Chọn chương để luyện. Xem đáp án và giải thích sau mỗi câu; câu trả lời sai tự vào sổ ôn tập.') + `<div class="controls"><select id="chselect"><option value="-1">Tất cả 6 chương</option>${chapters.map((c,i)=>`<option value="${i}">${i+1}. ${c.title}</option>`).join('')}</select><button onclick="startQuiz('chapter',+$('#chselect').value)">Bắt đầu luyện tập →</button></div><div class="cards">${chapters.map((c,i)=>`<div class="card"><span class="eyebrow">CHƯƠNG ${i+1}</span><h3>${c.title}</h3><p>${questions.filter(q=>q.c===i).length} câu có giải thích</p><button class="secondary" onclick="startQuiz('chapter',${i})">Luyện chương này</button></div>`).join('')}</div><p class="notice">Ngân hàng khởi đầu: 40 câu tự biên soạn. Luyện lại sẽ xáo thứ tự câu và đáp án; không phải các bộ đề độc lập mới.</p>`;
	if (page === 'exam') html = heading('THỬ SỨC NHƯ NGÀY THI', 'Đề mô phỏng Foundation Level', 'Tập quản lý thời gian và kiểm tra kiến thức ở cả 6 chương.') + `<div class="card lesson"><div class="stats"><div><h2>40 câu</h2><p>Mỗi câu 1 điểm</p></div><div><h2>60 phút</h2><p>Có lựa chọn 75 phút</p></div><div><h2>26/40</h2><p>Ngưỡng đạt 65%</p></div></div><p>Phân bổ chương: 8 · 6 · 4 · 11 · 9 · 2 câu. Có thể chuyển câu, đánh dấu xem lại, nộp sớm. Đáp án chỉ hiện khi nộp; hết giờ hệ thống tự chấm.</p><div class="controls"><select id="duration"><option value="60">60 phút tiêu chuẩn</option><option value="75">75 phút luyện theo thời gian gia hạn</option></select><button onclick="startQuiz('exam',-1,null,+$('#duration').value)">Bắt đầu đề mô phỏng →</button></div><p class="notice">Thời gian gia hạn thi thật cần được đơn vị tổ chức chấp thuận. Đề này dùng ngân hàng 40 câu của site, không phải đề chính thức và không đại diện trọn độ khó kỳ thi.</p></div>`;
	if (page === 'review') html = heading('ÔN TẬP NGẮT QUÃNG', 'Biến câu sai thành kiến thức vững', 'Trả lời đúng qua các lượt ôn: 1 → 3 → 7 → 14 → 30 ngày. Trả lời sai: quay về ôn sau 1 ngày.') + `<div class="controls"><button onclick="startQuiz('due')">Ôn đến hạn (${due().length})</button><button class="secondary" onclick="startQuiz('wrong')">Luyện tất cả câu sai (${state.wrong.length})</button></div>` + (state.wrong.length ? state.wrong.map(id => {
		let q = questions[id],
			r = state.reviews[id];
		return `<div class="card" style="margin:12px 0"><span class="eyebrow">CHƯƠNG ${q.c+1}</span><h3>${q.q}</h3><p>Lịch ôn: ${r?new Date(r.due).toLocaleDateString('vi'):'Hôm nay'} · Mức ghi nhớ ${r?.level||0}/5</p><button class="secondary" onclick="startQuiz('single',${id})">Ôn câu này</button> <button class="secondary" onclick="removeWrong(${id})">Bỏ lưu</button></div>`
	}).join('') : '<div class="card"><h2>Sổ câu sai đang trống</h2><p>Câu sai sẽ được lưu tự động sau khi anh trả lời. Bắt đầu bằng một lượt luyện theo chủ đề nhé.</p><a class="button" href="#practice">Luyện ngay</a></div>');
	if (page === 'flash') {
		html = heading('THUẬT NGỮ SONG NGỮ', 'Một thẻ nhỏ, một điều nhớ lâu', 'Nhấn thẻ để lật. Tự đánh giá sau khi thử nhớ định nghĩa.') + `<div class="controls"><button class="secondary" onclick="flashPool=terms.map((_,i)=>i);flashIndex=0;flipped=false;renderFlash()">Tất cả ${terms.length} thẻ</button><button class="secondary" onclick="flashPool=terms.map((_,i)=>i).filter(i=>!state.flashReviews[i]||state.flashReviews[i].due<=Date.now());flashIndex=0;flipped=false;renderFlash()">Thẻ đến hạn</button></div><div id="flashbody"></div>`
	}
	if (page === 'stats') {
		let exams = state.attempts.filter(a => a.exam);
		html = heading('NHÌN LẠI ĐỂ TIẾN BỘ', 'Kết quả & phần cần củng cố', 'Số liệu chỉ được tính từ những câu anh thực sự đã trả lời. Chương chưa luyện sẽ hiển thị “Chưa có dữ liệu”.') + `<div class="layout"><div class="card bars"><h2>Độ chính xác theo chương</h2>${chapters.map((c,i)=>{let all=state.attempts.flatMap(a=>a.results).filter(r=>questions[r.id].c===i),p=all.length?Math.round(all.filter(r=>r.ok).length/all.length*100):0;return `<div class="row"><span>${i+1}. ${c.title}</span><b>${all.length?p+'%':'—'}</b></div><div class="track"><i style="width:${p}%;background:${p<65?'#c49b65':'#6c9a71'}"></i></div><p style="font-size:10px">${all.length?all.length+' lượt trả lời · '+(p<65?'Cần củng cố':'Đang tiến bộ'):'Chưa có dữ liệu'}</p>`}).join('')}</div><div><div class="card"><h3>Đề mô phỏng</h3><p>${exams.length} đề đã nộp · ${exams.filter(x=>x.score>=26).length} lần đạt</p><p>Điểm trung bình tất cả lượt luyện: ${state.attempts.length?average()+'%':'Chưa có dữ liệu'}</p></div><div class="card" style="margin-top:18px"><h3>Lịch sử</h3>${recent()}</div></div></div>`
	}
	if (page === 'settings') html = heading('MINH BẠCH & CHỦ ĐỘNG', 'Nguồn, phiên bản & dữ liệu', 'Syllabus được kiểm tra ngày 05/11/2026. Bản đang dùng: CTFL v4.0.1, ngày phát hành 15/09/2024.') + `<div class="card lesson"><h2>Nguồn chính thức</h2><p><a href="https://istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/" target="_blank" rel="noopener">ISTQB CTFL — syllabus, quy định thi và đề mẫu ↗</a></p><p><a href="https://istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf" target="_blank" rel="noopener">Syllabus CTFL v4.0.1 (PDF) ↗</a> · <a href="https://glossary.istqb.org/" target="_blank" rel="noopener">Glossary ISTQB ↗</a></p><p>ISTQB và các tác giả giữ bản quyền syllabus. Nội dung tiếng Việt và câu hỏi tại đây được diễn giải, biên soạn độc lập. Mã bài trên site là chỉ mục nội bộ, không phải mã learning objective chính thức.</p><h2>Cập nhật khi syllabus thay đổi</h2><p>Kiểm tra phiên bản tại nguồn chính thức trước kỳ thi. Khi có bản mới, cần cập nhật bài, ngân hàng câu hỏi và ma trận đề, sau đó xuất bản lại site. Phiên bản này không tự tải hay tự sửa nội dung từ web.</p><h2>Tiến độ của anh</h2><p>Dữ liệu lưu cục bộ trên trình duyệt, không đồng bộ thiết bị. Xuất bản sao lưu thường xuyên để tránh mất khi xóa dữ liệu trình duyệt. Nhập bản sao lưu sẽ thay thế tiến độ hiện có.</p><div class="controls"><button onclick="exportData()">Xuất bản sao lưu JSON</button><label class="button secondary">Nhập bản sao lưu<input hidden type="file" accept="application/json" onchange="importData(this)"></label></div><p>Phiên bản nội dung 1.0 · 26 bài tổng hợp · 40 câu luyện · 24 flashcards.</p></div>`;
	$('#app').innerHTML = html;
	if (page === 'flash') renderFlash();
	window.scrollTo(0, 0)
}

function mark(k) {
	state.done = state.done.includes(k) ? state.done.filter(x => x !== k) : [...state.done, k];
	save();
	render()
}

function continueStudy() {
	for (let c = 0; c < chapters.length; c++)
		if (progress(c) < chapters[c].topics.length) {
			location.hash = 'chapter/' + c;
			return
		} location.hash = 'practice'
}

function shuffle(a) {
	return [...a].sort(() => Math.random() - .5)
}

function startQuiz(mode, c = -1, t = null, minutes = 60) {
	clearInterval(timer);
	let list = questions.filter(q => mode === 'due' ? due().includes(q.id) : mode === 'wrong' ? state.wrong.includes(q.id) : mode === 'single' ? q.id === c : (c < 0 || q.c === c) && (t === null || q.t === t));
	if (!list.length) {
		toast('Chưa có câu hỏi trong lựa chọn này.');
		return
	}
	quiz = {
		mode,
		list: shuffle(list).map(q => ({
			...q,
			shuffled: shuffle(q.options.map((s, i) => ({
				s,
				i
			})))
		})),
		index: 0,
		answers: {},
		checked: {},
		flags: [],
		end: Date.now() + minutes * 60000
	};
	drawQuiz();
	if (mode === 'exam') timer = setInterval(() => {
		if (!quiz) return;
		let left = Math.max(0, quiz.end - Date.now());
		let el = $('#clock');
		if (el) el.textContent = Math.floor(left / 60000) + ':' + String(Math.floor(left / 1000) % 60).padStart(2, '0');
		if (!left) finishQuiz()
	}, 1000)
}

function drawQuiz() {
	let q = quiz.list[quiz.index],
		a = quiz.answers[q.id],
		checked = quiz.checked[q.id],
		exam = quiz.mode === 'exam';
	$('#app').innerHTML = heading(exam ? 'ĐỀ MÔ PHỎNG' : 'LUYỆN TẬP', `Câu ${quiz.index+1} / ${quiz.list.length}`, `Chương ${q.c+1} · ${chapters[q.c].title}`) + `<div class="row"><span class="pill">${Object.keys(quiz.answers).length} câu đã trả lời</span>${exam?'<b id="clock"></b>':''}<button class="secondary" onclick="exitQuiz()">Thoát</button></div><div class="card" style="margin-top:20px"><h2>${q.q}</h2>${q.shuffled.map((o,i)=>`<button class="option ${a===o.i?'selected':''} ${checked&&o.i===0?'correct':''} ${checked&&a===o.i&&a!==0?'wrong':''}" onclick="choose(${o.i})" ${checked?'disabled':''}>${String.fromCharCode(65+i)}. ${o.s}</button>`).join('')}${checked?`<div class="explanation"><b>${a===0?'✓ Chính xác':'Cần xem lại'} · Đáp án: ${q.options[0]}</b><br>${q.why}<br><a href="#chapter/${q.c}">Đọc lại chương ${q.c+1} →</a></div>`:''}<div class="controls">${!exam&&!checked?`<button onclick="checkAnswer()" ${a===undefined?'disabled':''}>Kiểm tra đáp án</button>`:''}<button class="secondary" onclick="move(-1)" ${quiz.index===0?'disabled':''}>← Câu trước</button><button class="secondary" onclick="move(1)" ${quiz.index===quiz.list.length-1?'disabled':''}>Câu tiếp →</button>${exam?`<button class="secondary" onclick="flag()">${quiz.flags.includes(q.id)?'★ Đã đánh dấu':'☆ Xem lại'}</button>`:''}<button onclick="${exam?'confirmFinish()':'finishQuiz()'}">${exam?'Nộp bài':'Kết thúc lượt luyện'}</button></div></div>${exam?`<div class="reviewgrid">${quiz.list.map((x,i)=>`<button style="${quiz.answers[x.id]!==undefined?'background:#cfe3c9;':''}${i===quiz.index?'outline:2px solid #206b53':''}" onclick="quiz.index=${i};drawQuiz()">${i+1}${quiz.flags.includes(x.id)?'★':''}</button>`).join('')}</div>`:''}`
}

function choose(i) {
	quiz.answers[quiz.list[quiz.index].id] = i;
	drawQuiz()
}

function move(d) {
	quiz.index = Math.max(0, Math.min(quiz.list.length - 1, quiz.index + d));
	drawQuiz()
}

function flag() {
	let id = quiz.list[quiz.index].id;
	quiz.flags = quiz.flags.includes(id) ? quiz.flags.filter(x => x !== id) : [...quiz.flags, id];
	drawQuiz()
}

function schedule(id, ok) {
	if (!ok && !state.wrong.includes(id)) state.wrong.push(id);
	if (state.wrong.includes(id)) {
		let level = ok ? Math.min((state.reviews[id]?.level || 0) + 1, 5) : 0;
		state.reviews[id] = {
			level,
			due: Date.now() + [1, 1, 3, 7, 14, 30][level] * 86400000
		}
	}
}

function checkAnswer() {
	let q = quiz.list[quiz.index];
	if (quiz.answers[q.id] === undefined) return;
	quiz.checked[q.id] = true;
	schedule(q.id, quiz.answers[q.id] === 0);
	save();
	drawQuiz()
}

function exitQuiz() {
	if (confirm('Thoát lượt này? Kết quả chưa nộp sẽ không được ghi vào lịch sử.')) {
		quiz = null;
		render()
	}
}

function confirmFinish() {
	let left = quiz.list.length - Object.keys(quiz.answers).length;
	if (confirm(left ? `Còn ${left} câu chưa trả lời (tính 0 điểm). Nộp bài?` : 'Nộp bài và xem kết quả?')) finishQuiz()
}

function finishQuiz() {
	clearInterval(timer);
	let exam = quiz.mode === 'exam';
	let results = quiz.list.filter(q => exam || quiz.answers[q.id] !== undefined).map(q => ({
		id: q.id,
		ok: quiz.answers[q.id] === 0,
		answer: quiz.answers[q.id] ?? null
	}));
	if (!results.length) {
		toast('Anh chưa trả lời câu nào.');
		return
	}
	results.forEach(r => {
		if (exam || !quiz.checked[r.id]) schedule(r.id, r.ok)
	});
	let score = results.filter(r => r.ok).length,
		record = {
			name: exam ? 'Đề mô phỏng' : 'Luyện chủ đề',
			at: Date.now(),
			exam,
			score,
			total: results.length,
			results
		};
	state.attempts.push(record);
	save();
	let list = quiz.list;
	quiz = null;
	$('#app').innerHTML = heading('KẾT QUẢ LƯỢT LUYỆN', `${score} / ${results.length} điểm · ${Math.round(score/results.length*100)}%`, exam ? (score >= 26 ? 'Đạt ngưỡng mô phỏng. Hãy tiếp tục củng cố các phần chưa chắc.' : 'Chưa đạt ngưỡng 26/40. Mỗi câu sai là một cơ hội hiểu sâu hơn.') : 'Đã lưu kết quả. Câu sai được thêm vào lịch ôn tập.') + `<div class="controls"><a class="button" href="#review">Ôn câu sai</a><a class="button secondary" href="#stats">Xem phần còn yếu</a></div>` + results.map(r => {
		let q = list.find(q => q.id === r.id);
		return `<div class="card" style="margin:14px 0"><span class="pill">${r.ok?'✓ Đúng':'✕ Sai / chưa trả lời'} · Chương ${q.c+1}</span><h3>${q.q}</h3><p>Anh chọn: ${r.answer===null?'Chưa trả lời':q.options[r.answer]}<br><b>Đáp án: ${q.options[0]}</b></p><div class="explanation">${q.why}</div><a class="link" href="#chapter/${q.c}">Đọc lại bài →</a></div>`
	}).join('')
}

function removeWrong(id) {
	state.wrong = state.wrong.filter(x => x !== id);
	delete state.reviews[id];
	save();
	render()
}

function renderFlash() {
	if (!flashPool.length) {
		$('#flashbody').innerHTML = '<div class="card"><h2>Đã ôn hết thẻ đến hạn 🎉</h2><p>Quay lại ngày mai hoặc chọn tất cả thẻ để luyện thêm.</p></div>';
		return
	}
	flashIndex %= flashPool.length;
	let id = flashPool[flashIndex],
		t = terms[id];
	$('#flashbody').innerHTML = `<div class="row"><p>Thẻ ${flashIndex+1} / ${flashPool.length}</p><span class="pill">${state.known.includes(id)?'✓ Đã nhớ':'Đang học'}</span></div><button class="flash" style="width:100%;color:var(--ink)" onclick="flipped=!flipped;renderFlash()"><div><span class="eyebrow">${flipped?'ĐỊNH NGHĨA & Ý NGHĨA':'THUẬT NGỮ TIẾNG ANH'}</span><h2>${flipped?t[1]:t[0]}</h2><p>${flipped?t[2]:'Thử nhớ nghĩa trước khi lật thẻ'}</p><small>↻ Nhấn để lật</small></div></button><div class="controls"><button class="secondary" onclick="rateFlash(false)">Chưa nhớ · ôn ngày mai</button><button onclick="rateFlash(true)">Đã nhớ · tăng khoảng ôn</button><button class="secondary" onclick="flashIndex++;flipped=false;renderFlash()">Thẻ tiếp →</button></div>`
}

function rateFlash(ok) {
	let id = flashPool[flashIndex],
		level = ok ? Math.min((state.flashReviews[id]?.level || 0) + 1, 5) : 0;
	state.flashReviews[id] = {
		level,
		due: Date.now() + [1, 1, 3, 7, 14, 30][level] * 86400000
	};
	state.known = ok ? [...new Set([...state.known, id])] : state.known.filter(x => x !== id);
	save();
	flashIndex++;
	flipped = false;
	renderFlash();
	toast(ok ? 'Đã lưu lịch ôn tiếp theo' : 'Thẻ sẽ được ôn lại ngày mai')
}

function exportData() {
	let a = document.createElement('a');
	a.href = URL.createObjectURL(new Blob([JSON.stringify({
		version: 1,
		state
	}, null, 2)], {
		type: 'application/json'
	}));
	a.download = 'istqb-lab-progress.json';
	a.click();
	setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
async function importData(input) {
	try {
		let d = JSON.parse(await input.files[0].text()),
			s = d.state;
		let valid = d.version === 1 && s && Array.isArray(s.done) && s.done.every(x => /^\d-\d+$/.test(x) && chapters[+x.split('-')[0]]?.topics[+x.split('-')[1]]) && Array.isArray(s.wrong) && s.wrong.every(x => Number.isInteger(x) && questions[x]) && Array.isArray(s.known) && s.known.every(x => Number.isInteger(x) && terms[x]) && Array.isArray(s.attempts) && s.attempts.every(a => typeof a.name === 'string' && Number.isFinite(a.score) && Number.isFinite(a.total) && a.total > 0 && a.score >= 0 && a.score <= a.total && Number.isFinite(a.at) && Array.isArray(a.results) && a.results.every(r => questions[r.id] && typeof r.ok === 'boolean')) && s.reviews && typeof s.reviews === 'object' && Object.values(s.reviews).every(r => Number.isFinite(r.due) && Number.isInteger(r.level) && r.level >= 0 && r.level <= 5) && (!s.flashReviews || Object.values(s.flashReviews).every(r => Number.isFinite(r.due) && Number.isInteger(r.level) && r.level >= 0 && r.level <= 5));
		if (!valid) throw Error();
		if (confirm('Thay thế tiến độ hiện tại bằng bản sao lưu này?')) {
			state = s;
			state.flashReviews ||= {};
			save();
			render();
			toast('Đã khôi phục tiến độ')
		}
	} catch {
		toast('Bản sao lưu không hợp lệ. Dữ liệu hiện tại được giữ nguyên.')
	}
	input.value = ''
}
window.addEventListener('hashchange', () => {
	if (quiz) {
		quiz = null;
		clearInterval(timer)
	}
	render()
});
render();