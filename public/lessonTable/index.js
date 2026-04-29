class TimetableGenerator {
    constructor() {
        this.data = null;
        this.lessons = [];
        this.timetableData = {};
        this.currentDay = 1;
        this.currentWeek = 1;
        this.maxWeek = 0;
        this.hasWeekend = false;  // 是否有周末课程
        this.viewMode = 'day';    // 'day' 单日视图，'week' 周视图
        this.dayMap = {
            1: '星期一', 2: '星期二', 3: '星期三', 4: '星期四',
            5: '星期五', 6: '星期六', 7: '星期日'
        };
        this.init();
    }

    init() {
        // 事件绑定
        document.getElementById('jsonFile')?.addEventListener('change', (e) => this.handleFileUpload(e));
        document.getElementById('loadDefault')?.addEventListener('click', () => this.loadDefault());
        document.getElementById('downloadImage')?.addEventListener('click', () => this.downloadAsImage());
        document.getElementById('jsonFormatBtn')?.addEventListener('click', () => this.showJsonFormatModal());
        
        // JSON 格式 modal 关闭事件
        document.getElementById('jsonFormatModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'jsonFormatModal') {
                e.target.classList.remove('active');
            }
        });
        
        // 日视图按钮
        document.querySelectorAll('.day-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const day = parseInt(e.target.dataset.day);
                this.switchDay(day);
            });
        });

        // 视图切换按钮
        document.getElementById('viewDayMode')?.addEventListener('click', () => {
            this.viewMode = 'day';
            this.generateTimetableUI();
            this.updateViewModeButtons();
            document.querySelector('.day-buttons').style.display = 'flex';
            document.querySelector('.week-selector-group').style.display = 'none';
            this.updateDayButtonStates();
        });

        document.getElementById('viewWeekMode')?.addEventListener('click', () => {
            this.viewMode = 'week';
            this.currentWeek = 1;
            this.generateTimetableUI();
            this.updateViewModeButtons();
            document.querySelector('.day-buttons').style.display = 'none';
            document.querySelector('.week-selector-group').style.display = 'block';
        });

        // 周视图选择器
        document.getElementById('weekSelector')?.addEventListener('change', (e) => {
            this.currentWeek = parseInt(e.target.value);
            this.generateTimetableUI();
        });
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            this.processData(data);
        } catch (error) {
            this.showError('文件解析失败: ' + error.message);
        }
    }

    async loadDefault() {
        try {
            this.hideError();
            const response = await fetch('./课表_2025-2026-1_230200400_20260322.json');
            if (!response.ok) throw new Error('无法加载默认课表文件');
            const data = await response.json();
            this.processData(data);
        } catch (error) {
            this.showError('加载默认课表失败: ' + error.message);
        }
    }

    processData(data) {
        try {
            this.hideError();
            const rows = data.datas?.queryxskb?.rows || [];
            if (rows.length === 0) throw new Error('JSON文件中没有课程数据');

            this.lessons = rows;
            this.data = data;

            // 解析课表
            this.parseTimetable(rows);

            // 显示学生信息
            this.displayStudentInfo(rows[0]);

            // 初始化周选择器
            this.initializeWeekSelector();

            // 显示UI
            this.currentDay = 1;
            this.viewMode = 'day';
            this.generateTimetableUI();
            this.updateDayButtonStates();
            this.updateViewModeButtons();

            // 显示下载按钮
            document.getElementById('downloadImage').style.display = 'inline-flex';
        } catch (error) {
            this.showError('处理课表数据失败: ' + error.message);
        }
    }

    initializeWeekSelector() {
        const selector = document.getElementById('weekSelector');
        const selectorGroup = document.querySelector('.week-selector-group');
        
        if (!selector) return;

        selector.innerHTML = '';
        for (let i = 1; i <= this.maxWeek; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `第${i}周`;
            selector.appendChild(option);
        }
        selector.value = 1;
    }

    displayStudentInfo(firstLesson) {
        document.getElementById('studentName').textContent = firstLesson.XM || '未知';
        document.getElementById('className').textContent = firstLesson.SKBJ || '未知';
        document.getElementById('semester').textContent = firstLesson.XNXQDM_DISPLAY || '未知';
        document.getElementById('totalWeeks').textContent = this.maxWeek + '周';
        document.getElementById('info-panel').style.display = 'flex';
        document.getElementById('day-selector').style.display = 'flex';
    }

    parseTimetable(rows) {
        this.timetableData = {};
        this.maxWeek = 0;
        this.hasWeekend = false;  // 是否有周六周日的课程

        // 第一步：检测最大周数和是否有周末课程
        rows.forEach(lesson => {
            if (lesson.SKZC && lesson.SKZC.length > 0) {
                this.maxWeek = Math.max(this.maxWeek, lesson.SKZC.length);
            }
            // 检测是否有周六(6)或周日(7)的课程
            if (lesson.SKXQ === 6 || lesson.SKXQ === 7) {
                this.hasWeekend = true;
            }
        });

        // 如果没有检测到，尝试从ZCMC解析
        if (this.maxWeek === 0) {
            rows.forEach(lesson => {
                if (lesson.ZCMC) {
                    const weeks = this.extractWeeksFromZcmc(lesson.ZCMC);
                    this.maxWeek = Math.max(this.maxWeek, ...weeks);
                }
            });
        }

        // 默认25周
        if (this.maxWeek === 0) this.maxWeek = 25;

        this.maxWeek = 20;

        // 第二步：初始化数据结构
        for (let day = 1; day <= 7; day++) {
            this.timetableData[day] = {};
            for (let week = 1; week <= this.maxWeek; week++) {
                this.timetableData[day][week] = {};
                for (let period = 1; period <= 12; period++) {
                    this.timetableData[day][week][period] = null;
                }
            }
        }

        // 第三步：填充课程数据
        rows.forEach((lesson, index) => {
            const day = lesson.SKXQ;
            const startPeriod = lesson.KSJC;     // 开始节次
            const endPeriod = lesson.JSJC;       // 结束节次（不是持续节数！）
            const span = Math.max(1, Math.min(12, endPeriod - startPeriod + 1));
            const colorIndex = (index % 6) + 1;

            // 提取周次
            let weeks = [];
            if (lesson.SKZC) {
                for (let i = 0; i < lesson.SKZC.length; i++) {
                    if (lesson.SKZC[i] === '1') weeks.push(i + 1);
                }
            } else if (lesson.ZCMC) {
                weeks = this.extractWeeksFromZcmc(lesson.ZCMC);
            }

            // 填充数据
            if (day >= 1 && day <= 7 && weeks.length > 0 && startPeriod >= 1 && startPeriod <= 12) {
                weeks.forEach(week => {
                    // 初始化第一个单元格
                    if (!this.timetableData[day][week][startPeriod]) {
                        this.timetableData[day][week][startPeriod] = {
                            lessons: [],
                            span: span
                        };
                    }

                    // 检查是否已存在相同课程（安全检查：确保 lessons 数组存在）
                    if (!Array.isArray(this.timetableData[day][week][startPeriod].lessons)) {
                        this.timetableData[day][week][startPeriod].lessons = [];
                    }

                    const exists = this.timetableData[day][week][startPeriod].lessons.some(l =>
                        (l.JXBID && lesson.JXBID && l.JXBID === lesson.JXBID) ||
                        (l.KCH && lesson.KCH && l.KCH === lesson.KCH)
                    );

                    if (!exists) {
                        this.timetableData[day][week][startPeriod].lessons.push({
                            ...lesson,
                            colorClass: `color-${colorIndex}`
                        });
                    }

                    // 标记后续单元格为占用
                    for (let p = startPeriod + 1; p <= endPeriod && p <= 12; p++) {
                        this.timetableData[day][week][p] = { occupiedByStart: startPeriod };
                    }
                });
            }
        });
    }

    extractWeeksFromZcmc(zcmc) {
        const weeks = [];
        if (!zcmc) return weeks;

        const parts = zcmc.split(',');
        parts.forEach(part => {
            part = part.trim();
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(s => parseInt(s.match(/\d+/)[0]));
                for (let i = start; i <= end; i++) {
                    if (!weeks.includes(i)) weeks.push(i);
                }
            } else {
                const week = parseInt(part.match(/\d+/)[0]);
                if (!weeks.includes(week)) weeks.push(week);
            }
        });

        return weeks.sort((a, b) => a - b);
    }

    switchDay(day) {
        this.currentDay = day;
        this.viewMode = 'day';
        this.generateTimetableUI();
        this.updateDayButtonStates();
    }

    switchWeek(week) {
        this.currentWeek = week;
        this.viewMode = 'week';
        this.generateTimetableUI();
        this.updateWeekButtonStates();
    }

    updateDayButtonStates() {
        document.querySelectorAll('.day-btn').forEach(btn => {
            if (parseInt(btn.dataset.day) === this.currentDay) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    updateWeekButtonStates() {
        document.querySelectorAll('.week-btn').forEach(btn => {
            if (parseInt(btn.dataset.week) === this.currentWeek) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    updateViewModeButtons() {
        const dayModeBtn = document.getElementById('viewDayMode');
        const weekModeBtn = document.getElementById('viewWeekMode');
        if (dayModeBtn && weekModeBtn) {
            if (this.viewMode === 'day') {
                dayModeBtn.classList.add('active');
                weekModeBtn.classList.remove('active');
            } else {
                dayModeBtn.classList.remove('active');
                weekModeBtn.classList.add('active');
            }
        }
    }

    generateTimetableUI() {
        if (this.viewMode === 'week') {
            this.generateWeekView();
        } else {
            this.generateDayView();
        }
    }

    generateDayView() {
        const container = document.getElementById('timetable');
        if (!container) return;

        const timeLabels = [
            '08:00', '08:50', '09:50', '10:40',
            '11:30', '12:20', '13:00', '14:00',
            '14:50', '15:40', '16:30', '17:20'
        ];

        // 重置网格列数为默认（周次列 + 12个时间段）
        container.style.gridTemplateColumns = '70px repeat(12, 1fr)';
        container.innerHTML = '';
        
        // 添加日视图标记用于CSS识别
        container.classList.remove('week-view');
        container.classList.add('day-view');

        // 表头：周次列 + 12个时间段
        container.appendChild(this.createHeaderCell('周次'));
        for (let period = 1; period <= 12; period++) {
            container.appendChild(this.createHeaderCell(`${period}节<br>${timeLabels[period - 1]}`));
        }

        // 行：每周一行
        for (let week = 1; week <= this.maxWeek; week++) {
            container.appendChild(this.createWeekCell(week));

            for (let period = 1; period <= 12; ) {
                const cellContent = this.timetableData[this.currentDay][week][period];

                if (cellContent && cellContent.occupiedByStart) {
                    period++;
                } else if (cellContent && cellContent.lessons && cellContent.lessons.length > 0) {
                    const span = cellContent.span || 1;
                    container.appendChild(this.createLessonCell(cellContent.lessons, span));
                    period += span;
                } else {
                    container.appendChild(this.createEmptyCell());
                    period++;
                }
            }
        }

        document.getElementById('timetable-container').style.display = 'block';
        document.getElementById('empty-state').style.display = 'none';
    }

    generateWeekView() {
        const container = document.getElementById('timetable');
        if (!container) return;

        const timeLabels = [
            '08:00', '08:50', '09:50', '10:40',
            '11:30', '12:20', '13:00', '14:00',
            '14:50', '15:40', '16:30', '17:20'
        ];

        // 确定要显示的天数（自动检测周末）
        const maxDay = this.hasWeekend ? 7 : 5;
        const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

        // 更新网格列数（在清空前更新）
        container.style.gridTemplateColumns = `70px repeat(${maxDay}, 1fr)`;
        container.innerHTML = '';
        
        // 添加周视图标记用于CSS识别
        container.classList.remove('day-view');
        container.classList.add('week-view');

        // 表头：时间列 + 各天
        container.appendChild(this.createHeaderCell('时间'));
        for (let day = 1; day <= maxDay; day++) {
            container.appendChild(this.createHeaderCell(dayNames[day - 1]));
        }

        // 行：每个时间段一行
        for (let period = 1; period <= 12; period++) {
            // 时间标签
            const timeCell = document.createElement('div');
            timeCell.className = 'timetable-time-cell';
            timeCell.innerHTML = `${period}节<br>${timeLabels[period - 1]}`;
            container.appendChild(timeCell);

            // 各天的课程
            for (let day = 1; day <= maxDay; day++) {
                const cellContent = this.timetableData[day][this.currentWeek][period];

                if (cellContent && cellContent.occupiedByStart) {
                    // 被占用 - 跳过，因为这一行已被上面的课程占据
                    continue;
                } else if (cellContent && cellContent.lessons && cellContent.lessons.length > 0) {
                    const span = cellContent.span || 1;
                    // 在周视图中，课程跨越多行（时间段），而不是多列（天数）
                    container.appendChild(this.createLessonCell(cellContent.lessons, span, 'row'));
                } else {
                    container.appendChild(this.createEmptyCell());
                }
            }
        }

        document.getElementById('timetable-container').style.display = 'block';
        document.getElementById('empty-state').style.display = 'none';
    }

    createHeaderCell(text) {
        const cell = document.createElement('div');
        cell.className = 'timetable-header';
        cell.innerHTML = text;
        return cell;
    }

    createWeekCell(week) {
        const cell = document.createElement('div');
        cell.className = 'timetable-time-cell';
        cell.innerHTML = `<div>第${week}周</div>`;
        return cell;
    }

    createEmptyCell() {
        const cell = document.createElement('div');
        cell.className = 'timetable-cell';
        return cell;
    }

    createLessonCell(lessons, span = 1, spanDirection = 'column') {
        const cell = document.createElement('div');
        cell.className = 'timetable-cell';
        if (span > 1) {
            if (spanDirection === 'row') {
                // 周视图：课程跨多行（时间段）
                cell.style.gridRow = `span ${span}`;
            } else {
                // 日视图：课程跨多列（时间段）
                cell.style.gridColumn = `span ${span}`;
            }
        }

        lessons.forEach(lesson => {
            const card = document.createElement('div');
            let className = `lesson-card ${lesson.colorClass}`;
            // 如果是选修课，添加 elective 类
            if (lesson.KCPYCCDM_DISPLAY && lesson.KCPYCCDM_DISPLAY.includes('选修')) {
                className += ' elective';
            }
            card.className = className;
            card.style.flex = '1';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.justifyContent = 'center';
            card.style.padding = '4px';
            card.style.borderRadius = '4px';
            card.style.minHeight = '0';
            card.style.overflow = 'hidden';
            card.style.cursor = 'pointer';

            const name = document.createElement('div');
            name.style.fontWeight = '600';
            name.style.fontSize = '11px';
            name.style.marginBottom = '2px';
            name.textContent = lesson.KCM;

            const period = document.createElement('div');
            period.style.fontSize = '10px';
            period.style.fontWeight = '500';
            period.style.color = '#C4A76C';
            period.style.marginBottom = '2px';
            period.textContent = `第${lesson.KSJC}-${lesson.JSJC}节`;

            const teacher = document.createElement('div');
            teacher.style.fontSize = '10px';
            teacher.style.opacity = '0.9';
            teacher.style.marginBottom = '1px';
            teacher.textContent = lesson.SKJS;

            const location = document.createElement('div');
            location.style.fontSize = '9px';
            location.style.opacity = '0.8';
            location.textContent = lesson.JASMC;

            card.appendChild(name);
            card.appendChild(period);
            card.appendChild(teacher);
            card.appendChild(location);

            card.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showLessonDetail(lesson);
            });

            cell.appendChild(card);
        });

        return cell;
    }

    showLessonDetail(lesson) {
        const modal = document.createElement('div');
        modal.className = 'lesson-modal active';

        const content = document.createElement('div');
        content.className = 'lesson-modal-content';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => modal.remove();

        const header = document.createElement('div');
        header.className = 'modal-header';
        header.textContent = lesson.KCM;

        const info = document.createElement('div');
        info.innerHTML = `
            <div class="modal-item">
                <div class="modal-label">教师</div>
                <div class="modal-value">${lesson.SKJS}</div>
            </div>
            <div class="modal-item">
                <div class="modal-label">地点</div>
                <div class="modal-value">${lesson.JASMC}</div>
            </div>
            <div class="modal-item">
                <div class="modal-label">学分</div>
                <div class="modal-value">${lesson.XF}</div>
            </div>
            <div class="modal-item">
                <div class="modal-label">学时</div>
                <div class="modal-value">${lesson.XS}</div>
            </div>
            <div class="modal-item">
                <div class="modal-label">周次</div>
                <div class="modal-value">${lesson.ZCMC}</div>
            </div>
            <div class="modal-item">
                <div class="modal-label">课程代码</div>
                <div class="modal-value">${lesson.KCH}</div>
            </div>
            <div class="modal-item">
                <div class="modal-label">开课单位</div>
                <div class="modal-value">${lesson.KKDWDM_DISPLAY}</div>
            </div>
            <div class="modal-item">
                <div class="modal-label">课程分类</div>
                <div class="modal-value">${lesson.KCPYCCDM_DISPLAY}</div>
            </div>
        `;

        content.appendChild(closeBtn);
        content.appendChild(header);
        content.appendChild(info);
        modal.appendChild(content);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        document.body.appendChild(modal);
    }

    showError(message) {
        const errorEl = document.getElementById('error-message');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }

    hideError() {
        const errorEl = document.getElementById('error-message');
        if (errorEl) errorEl.style.display = 'none';
    }

    showJsonFormatModal() {
        const modal = document.getElementById('jsonFormatModal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    downloadAsImage() {
        const element = document.getElementById('timetable-container');
        if (!element) return;

        html2canvas(element, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            allowTaint: true
        }).then(canvas => {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `课表_${this.dayMap[this.currentDay]}_${new Date().toISOString().slice(0, 10)}.png`;
            link.click();
        }).catch(error => {
            this.showError('下载失败: ' + error.message);
        });
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new TimetableGenerator();
    // 自动加载默认课表
    setTimeout(() => {
        document.getElementById('loadDefault')?.click();
    }, 500);
});
