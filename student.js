// 返回上一页  
function goBack() {  
    window.history.back();  
}  

function showMessage(text) {  
    const messageDiv = document.getElementById("message");  
    messageDiv.textContent = text;  
    messageDiv.style.display = "block"; // 显示消息  

    setTimeout(() => {  
        messageDiv.style.display = "none"; // 1秒后隐藏消息  
    }, 1000);  
}

// 加载学生名单  
function loadStudentList() {  
    // 注册工具提示事件  
    registerTooltipEvents(); 
    const students = JSON.parse(localStorage.getItem('students')) || [];  
    const list = document.getElementById('studentList');  
    list.innerHTML = '';  

    if (students.length === 0) {  
        list.innerHTML = '<div>尚未导入任何学生名单。</div>';  
        return;  
    }  

    // 积分从大到小排序学生  
    students.sort((a, b) => b.points - a.points);  

    students.forEach((student, index) => {  
        list.innerHTML += `  
            <div>  
                ${student.id} - ${student.name} - 积分: ${student.points}  
                <button   
                    data-tooltip="清除积分"  
                    onclick="clearStudentPoints(${index})"  
                    style="background: none; border: none; padding: 0; cursor: pointer;">  
                    <img src="clear-icon.svg" alt="清除" style="width: 40px; height: 40px;" />   
                </button>  
                <button   
                    data-tooltip="删除学生"  
                    onclick="deleteStudent(${index})"  
                    style="background: none; border: none; padding: 0; cursor: pointer;">  
                    <img src="delete-icon.svg" alt="删除" style="width: 40px; height: 40px;" />   
                </button>  
            </div>`;  
    });    
    registerTooltipEvents();
}  

function registerTooltipEvents() {  
    const buttons = document.querySelectorAll('button[data-tooltip]');  
    const tooltip = document.getElementById('tooltip');  

    buttons.forEach(button => {  
        button.addEventListener('mouseenter', function(event) {  
            tooltip.textContent = button.getAttribute('data-tooltip');  
            tooltip.style.display = 'block';  
            tooltip.style.left = event.pageX + 'px';  
            tooltip.style.top = (event.pageY + 20) + 'px'; // 鼠标下方略微偏移  
        });  

        button.addEventListener('mouseleave', function() {  
            tooltip.style.display = 'none';  
        });  
    });  
}  

// 清除单个学生积分  
function clearStudentPoints(index) {  
    const students = JSON.parse(localStorage.getItem('students')) || [];  
    students[index].points = 0; // 清除该学生的积分  
    localStorage.setItem('students', JSON.stringify(students)); // 更新本地存储  
    loadStudentList(); // 重新加载学生列表  
    showMessage("已清除该学生积分。");  
}  

// 删除单个学生  
function deleteStudent(index) {  
    let students = JSON.parse(localStorage.getItem('students')) || [];  
    students.splice(index, 1); // 删除该学生  
    localStorage.setItem('students', JSON.stringify(students)); // 更新本地存储  
    loadStudentList(); // 重新加载学生列表  
    showMessage("已删除该学生。");  
}                                                                               

// 一键清除所有学生的积分  
function resetAllPoints() {  
    let students = JSON.parse(localStorage.getItem('students')) || [];  
    students.forEach(student => student.points = 0); // 清除所有学生的积分  
    localStorage.setItem('students', JSON.stringify(students)); // 更新本地存储  
    loadStudentList(); // 重新加载学生列表  
    showMessage("所有学生的积分已清除。");  
}  

window.onload = loadStudentList; // 页面加载时调用  