
// 전역 변수
let attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || [];

// DOM 요소 참조
const studentBtn = document.getElementById('studentBtn');
const teacherBtn = document.getElementById('teacherBtn');
const studentSection = document.getElementById('studentSection');
const teacherSection = document.getElementById('teacherSection');
const attendanceForm = document.getElementById('attendanceForm');
const dateSelect = document.getElementById('dateSelect');
const classFilter = document.getElementById('classFilter');
const clearAllBtn = document.getElementById('clearAllBtn');

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 오늘 날짜 설정
    const today = new Date().toISOString().split('T')[0];
    dateSelect.value = today;
    
    // 초기 화면 설정
    showStudentSection();
    updateTeacherView();
});

// 역할 선택 버튼 이벤트
studentBtn.addEventListener('click', showStudentSection);
teacherBtn.addEventListener('click', showTeacherSection);

function showStudentSection() {
    studentBtn.classList.add('active');
    teacherBtn.classList.remove('active');
    studentSection.classList.add('active');
    teacherSection.classList.remove('active');
}

function showTeacherSection() {
    teacherBtn.classList.add('active');
    studentBtn.classList.remove('active');
    teacherSection.classList.add('active');
    studentSection.classList.remove('active');
    updateTeacherView();
}

// 출결 사유 제출 폼 처리
attendanceForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(attendanceForm);
    const record = {
        id: Date.now(),
        studentName: formData.get('studentName') || document.getElementById('studentName').value,
        studentClass: formData.get('studentClass') || document.getElementById('studentClass').value,
        attendanceType: formData.get('attendanceType'),
        reason: formData.get('reason') || document.getElementById('reason').value,
        memo: formData.get('memo') || document.getElementById('memo').value,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toLocaleString('ko-KR')
    };
    
    // 유효성 검사
    if (!record.studentName || !record.studentClass || !record.attendanceType || !record.reason) {
        alert('모든 필수 항목을 입력해주세요.');
        return;
    }
    
    // 기록 저장
    attendanceRecords.push(record);
    localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
    
    // 폼 초기화
    attendanceForm.reset();
    
    alert('출결 사유가 성공적으로 제출되었습니다.');
    
    // 교사 화면이 활성화되어 있다면 업데이트
    if (teacherSection.classList.contains('active')) {
        updateTeacherView();
    }
});

// 교사 화면 업데이트
function updateTeacherView() {
    const selectedDate = dateSelect.value;
    const selectedClass = classFilter.value;
    
    // 필터링된 기록 가져오기
    const filteredRecords = attendanceRecords.filter(record => {
        const dateMatch = !selectedDate || record.date === selectedDate;
        const classMatch = !selectedClass || record.studentClass === selectedClass;
        return dateMatch && classMatch;
    });
    
    // 통계 업데이트
    updateStatistics(filteredRecords);
    
    // 기록 목록 업데이트
    displayRecords(filteredRecords);
}

// 통계 업데이트
function updateStatistics(records) {
    const stats = {
        late: 0,
        absent: 0,
        early: 0
    };
    
    records.forEach(record => {
        if (record.attendanceType === '지각') {
            stats.late++;
        } else if (record.attendanceType === '결석') {
            stats.absent++;
        } else if (record.attendanceType === '조퇴' || record.attendanceType === '외출') {
            stats.early++;
        }
    });
    
    document.getElementById('lateCount').textContent = stats.late;
    document.getElementById('absentCount').textContent = stats.absent;
    document.getElementById('earlyCount').textContent = stats.early;
    
    // 정상 출석은 임의로 계산 (실제로는 전체 학생 수에서 빼야 함)
    document.getElementById('normalCount').textContent = Math.max(0, 30 - stats.late - stats.absent - stats.early);
}

// 기록 목록 표시
function displayRecords(records) {
    const container = document.getElementById('attendanceRecords');
    
    if (records.length === 0) {
        container.innerHTML = '<p class="no-records">해당 조건에 맞는 출결 사유가 없습니다.</p>';
        return;
    }
    
    // 최신 순으로 정렬
    records.sort((a, b) => b.id - a.id);
    
    container.innerHTML = records.map(record => `
        <div class="record-item ${record.attendanceType}">
            <button class="delete-btn" onclick="deleteRecord(${record.id})">삭제</button>
            <div class="record-header">
                <div class="student-info">
                    ${record.studentName} (${record.studentClass})
                </div>
                <div class="attendance-type ${record.attendanceType}">
                    ${record.attendanceType}
                </div>
            </div>
            <div class="record-details">
                <strong>사유:</strong> ${record.reason}<br>
                <strong>제출 시간:</strong> ${record.timestamp}
            </div>
            ${record.memo ? `<div class="record-memo"><strong>메모:</strong> ${record.memo}</div>` : ''}
        </div>
    `).join('');
}

// 개별 기록 삭제
function deleteRecord(id) {
    if (confirm('이 기록을 삭제하시겠습니까?')) {
        attendanceRecords = attendanceRecords.filter(record => record.id !== id);
        localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
        updateTeacherView();
    }
}

// 전체 기록 삭제
clearAllBtn.addEventListener('click', function() {
    if (confirm('모든 출결 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        attendanceRecords = [];
        localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
        updateTeacherView();
        alert('모든 기록이 삭제되었습니다.');
    }
});

// 필터 변경 이벤트
dateSelect.addEventListener('change', updateTeacherView);
classFilter.addEventListener('change', updateTeacherView);

// 유용한 유틸리티 함수들
function exportToCSV() {
    if (attendanceRecords.length === 0) {
        alert('내보낼 데이터가 없습니다.');
        return;
    }
    
    const csvContent = "data:text/csv;charset=utf-8," 
        + "날짜,학생명,학반,출결상태,사유,메모,제출시간\n"
        + attendanceRecords.map(record => 
            `${record.date},${record.studentName},${record.studentClass},${record.attendanceType},${record.reason},"${record.memo}",${record.timestamp}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `출결기록_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 주간 통계 계산
function getWeeklyStats() {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyRecords = attendanceRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= weekAgo && recordDate <= today;
    });
    
    return {
        total: weeklyRecords.length,
        late: weeklyRecords.filter(r => r.attendanceType === '지각').length,
        absent: weeklyRecords.filter(r => r.attendanceType === '결석').length,
        early: weeklyRecords.filter(r => r.attendanceType === '조퇴' || r.attendanceType === '외출').length
    };
}

// 키보드 단축키
document.addEventListener('keydown', function(e) {
    // Ctrl + S: 학생 화면으로 전환
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        showStudentSection();
    }
    // Ctrl + T: 교사 화면으로 전환
    if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        showTeacherSection();
    }
});
