let students = JSON.parse(localStorage.getItem('students')) || [];
let selectedStudent = null;
let intervalId;
let lock = false;//自动加分锁
let lock1 = false;//手动加分锁
let onClassAdded = false;
let autoPointsAdded = false;
let manualPointsUsed = false;
let studentDrawn = false;
let starLock = false;

const stars = document.querySelectorAll('.rating label');

stars.forEach(star => {
    star.addEventListener('mouseenter', () => {
        const number = star.querySelector('.star-number');
        number.classList.remove('hidden');
    });
    
    star.addEventListener('mouseleave', () => {
        const number = star.querySelector('.star-number');
        number.classList.add('hidden');
    });
});

const particleCanvas = document.getElementById('particleCanvas');
const particleCtx = particleCanvas.getContext('2d');
particleCanvas.width = window.innerWidth;
particleCanvas.height = window.innerHeight;

let particles = [];

function createParticlesFromText(a, b) {
    // 清空画布
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

    // 设置字体
    particleCtx.font = '150px "Long Cang"';
    particleCtx.fillStyle = '#003366';

    // 绘制第一行文字
    const x1 = particleCanvas.width / 2 - particleCtx.measureText(selectedStudent.name).width / 2;
    const y1 = particleCanvas.height / 2 - 50;  // 向上移动50像素
    particleCtx.fillText(selectedStudent.name, x1, y1);

    // 绘制第二行文字
    const x2 = particleCanvas.width / 2 - particleCtx.measureText(selectedStudent.id).width / 2;
    const y2 = particleCanvas.height / 2 + 70;  // 向下移动70像素
    particleCtx.fillText(selectedStudent.id, x2, y2);

    // 获取整个画布的像素数据
    const imageData = particleCtx.getImageData(0, 0, particleCanvas.width, particleCanvas.height);

    // 清空粒子数组
    particles = [];

    // 创建粒子
    for (let y = 0; y < imageData.height; y += 2) {
        for (let x = 0; x < imageData.width; x += 2) {
            const index = (y * imageData.width + x) * 4;
            const alpha = imageData.data[index + 3];
            if (alpha > 128) {  // 只选择不透明的像素
                let particle = new Particle(Math.random() * particleCanvas.width, Math.random() * particleCanvas.height);
                particle.targetX = x;
                particle.targetY = y;
                particles.push(particle);
            }
        }
    }

    // 启动粒子动画
    animateParticles();
}

function Particle(x, y) {
    this.x = x;
    this.y = y;
    this.size = 1;
    this.baseX = this.x;
    this.baseY = this.y;
    this.density = Math.random() * 30 + 1;
}

Particle.prototype.draw = function () {
    particleCtx.fillStyle = 'black';
    particleCtx.beginPath();
    particleCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);  // 绘制粒子
    particleCtx.closePath();
    particleCtx.fill();
};

Particle.prototype.update = function () {
    let dx = this.targetX - this.x;
    let dy = this.targetY - this.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    let speed = distance / 20;  // 移动速度，离目标越远速度越快
    this.x += dx / distance * speed;
    this.y += dy / distance * speed;

    // 减少抖动，当粒子非常接近目标位置时停止移动
    if (distance < 1) {
        this.x = this.targetX;
        this.y = this.targetY;
    }
};

function animateParticles() {
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);  // 清除上一帧的粒子

    particles.forEach(particle => {
        particle.update();  // 更新每个粒子的状态
        particle.draw();    // 绘制每个粒子
    });

    requestAnimationFrame(animateParticles);  // 循环动画
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

function showMessage(text) {  
    const messageDiv = document.getElementById("message");  
    messageDiv.textContent = text;  
    messageDiv.style.display = "block"; // 显示消息  

    setTimeout(() => {  
        messageDiv.style.display = "none"; // 1秒后隐藏消息  
    }, 1000);  
} 

window.onload = function() {
    // 注册工具提示事件  
    registerTooltipEvents();
    resetStars();
    const storedStudent = localStorage.getItem('selectedStudent');//获取selectedStudent
    if (storedStudent) {
        selectedStudent = JSON.parse(storedStudent);
        document.getElementById('selectedStudent').innerText = `${selectedStudent.name} (学号: ${selectedStudent.id})`;
        autoPointsAdded = localStorage.getItem('autoPointsAdded') === 'true';
        manualPointsUsed = localStorage.getItem('manualPointsUsed') === 'true';
        starLock = localStorage.getItem('starLock') === 'true';
        onClassAdded = localStorage.getItem('onClassAdded') === 'true';
    }
    //toggleButtons();//按键锁
};

function uploadFile() {  
    const input = document.getElementById('fileInput');  
    const file = input.files[0];  
    if (!file) {  
        showMessage("请选择一个文件！");  
        return;  
    } 

    const reader = new FileReader();  
    reader.onload = function(e) {  
        const data = new Uint8Array(e.target.result);  
        const workbook = XLSX.read(data, { type: 'array' });  
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];  

        // 读取所有行（包括空行）  
        let allStudents = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });  

        // 如果没有数据，则提示用户  
        if (allStudents.length < 2) {  
            showMessage("工作表中没有有效数据！");  
            return;  
        }  

        // 去掉表头  
        allStudents = allStudents.slice(1); 

        // 过滤有效行，确保每行的有效性  
        students = allStudents  
            .filter(row => row[0] !== undefined && row[0] !== null && row[0] !== '') // 确保 ID 不为空  
            .map(row => ({  
                id: row[0],  
                name: row[1],   // 假设第二列为名字  
            points: 0       // 默认分数为 0  
            }));  

        // 如果没有有效的学生数据，则提示  
        if (students.length === 0) {  
            showMessage("工作表中没有有效学生数据！");  
            return;  
        }  

        localStorage.setItem('students', JSON.stringify(students));  
        showMessage("学生名单导入成功！");  
        toggleButtons();  
    };  
    reader.readAsArrayBuffer(file);  
}

function updateFileName() {  
    const input = document.getElementById('fileInput');  
    const fileName = document.getElementById('fileName');  
    if (input.files.length > 0) {  
        fileName.innerText = input.files[0].name; // 显示选择的文件名  
    } else {  
        fileName.innerText = '未选择文件'; // 显示未选择文件的提示  
    }  
} 

/*function toggleButtons() {
    const buttons = ['drawButton', 'correctButton', 'incorrectButton', 'manualButton'];
    const enable = students.length > 0;
    buttons.forEach(buttonId => {
        document.getElementById(buttonId).disabled = !enable;
    });
}*/

function viewStudentList() {
    window.location.href = 'studentList.html';
}

function startDraw() {
    if (students.length === 0) {
        showMessage("请先导入学生名单！");
        uploadModal.style.display = 'block'; // 显示模态框
        return;
    }
    // 隐藏页面元素
    document.querySelector('.container').classList.add('hidden');
    resetStars();

    lock = false;
    lock1 = false;
    onClassAdded = false;
    autoPointsAdded = false;
    manualPointsUsed = false;
    starLock = false;


    const totalPoints = students.reduce((sum, student) => sum + (student.points > 10 ? 1 / student.points : 10 - student.points), 0);
    const randomValue = Math.random() * totalPoints;
    let cumulativePoints = 0;

    for (const student of students) {
        cumulativePoints += Math.max(1, 10 - student.points);
        if (randomValue < cumulativePoints) {
            selectedStudent = student;
            break;
        }
    }

    setTimeout(scrollStudents, 350);
}

function onClass() {
    if(!onClassAdded && selectedStudent) {
        selectedStudent.points += 1;
        synPoints();
        onClassAdded = true;
        updateLocalStorage();
        showMessage(`${selectedStudent.name}到场，加分 1。`); 
    } else if (!selectedStudent) {
        showMessage("请先抽取一位学生");
    } else {
        showMessage("到场已加分");
    }
}

document.addEventListener('click', async function(event) {  
    const drawButton = document.getElementById('drawButton');  
    const scrollingNamesDiv = document.getElementById('scrollingNames');  
    const selectedStudentDiv = document.getElementById('selectedStudent'); 

    if(!clickEnabled){
        return;
    }

    if (!drawButton.contains(event.target) &&   
        !scrollingNamesDiv.contains(event.target) &&   
        !selectedStudentDiv.contains(event.target)) {  

        // 清空显示的被点到学生信息  
        scrollingNamesDiv.innerHTML = '';  

        particles = [];  
        particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);  

        // 恢复页面元素  
        document.querySelector('.container').classList.remove('hidden');  
        selectedStudentDiv.style.display = 'block'; // 显示  
    }  
});

function synPoints() {
    // 更新 students 数组中的相应学生积分  
    const studentIndex = students.findIndex(s => s.id === selectedStudent.id);  
    if (studentIndex !== -1) {  
        students[studentIndex].points = selectedStudent.points;  // 确保 students 数组中的积分也更新  
    }
}

function repeatCorrectly() {
    if (!lock && selectedStudent && !autoPointsAdded) {
        selectedStudent.points += 0.5;
        synPoints();
        autoPointsAdded = true;
        lock = true;
        updateLocalStorage();
        showMessage(`已为 ${selectedStudent.name}加分 0.5。`);  
    } else if (!selectedStudent) {
        showMessage("请先抽取一位学生");
    } else {
        showMessage("已为该学生加过分");
    }
}


function repeatIncorrectly() {
    if (!lock && selectedStudent && !autoPointsAdded) {
        selectedStudent.points -= 1;
        synPoints();
        autoPointsAdded = true;
        lock = true;
        updateLocalStorage();
        showMessage(`已为 ${selectedStudent.name} 扣分 1。`);
    } else if (!selectedStudent) {
        showMessage("请先抽取一位学生");
    } else {
        showMessage("已为该学生加过分");
    }
}

let clickEnabled = true; // 用于跟踪点击是否被允许  

function scrollStudents() {  
    document.getElementById('selectedStudent').innerText = '';  
    const scrollingNamesDiv = document.getElementById('scrollingNames');  
    scrollingNamesDiv.innerHTML = '';  
    let index = 0;  

    clickEnabled = false; // 禁用点击  

    return new Promise((resolve) => {  
        intervalId = setInterval(() => {  
            scrollingNamesDiv.innerText = students[index].name;  
            index = (index + 1) % students.length;  
        }, 100);  

        setTimeout(() => {  
        clearInterval(intervalId);  
            scrollingNamesDiv.innerHTML = '';  
            if (selectedStudent) {  
                document.getElementById('selectedStudent').innerText = `${selectedStudent.name} (学号: ${selectedStudent.id})`;  
                document.getElementById('selectedStudent').style.display = 'none'; // 隐藏  
                createParticlesFromText(`${selectedStudent.name} (学号:${selectedStudent.id})`);  
                updateLocalStorage();  
            }  
            resolve(); // 完成滚动时解析Promise  
            clickEnabled = true; // 恢复点击  
        }, 3000);  
    });  
}  

function updateLocalStorage() {
    localStorage.setItem('selectedStudent', JSON.stringify(selectedStudent));
    localStorage.setItem('students', JSON.stringify(students));
    localStorage.setItem('autoPointsAdded', autoPointsAdded);
    localStorage.setItem('manualPointsUsed', manualPointsUsed);
    localStorage.setItem('starLock',starLock);
    localStorage.setItem('onClassAdded',onClassAdded);
}

// 初始化星级点击事件监听器
document.querySelectorAll('.rating input').forEach(star => {
    star.addEventListener('change', function() {
        if (!starLock) {  // 检查星星是否已经被点击过
            updatePoints(this.value);
        } else {
            showMessage("每次点名只能点击一次星星进行加分。");
        }
    });
});

// 根据选中的星级为学生加分
function updatePoints(points) {
    points = parseFloat(points); // 将点击的星星值转换为整数
    if (selectedStudent) {
        if (!starLock) {  // 检查星星是否已经被点击过
            selectedStudent.points += points;  // 根据星星值加分
            synPoints();
            showMessage(`已为 ${selectedStudent.name} 加分 ${points}。`);
            starLock = true;  // 点击后锁定星星不能再加分
            updateLocalStorage();
        } else {
            showMessage("每次点名只能点击一次星星进行加分。");
        }
    } else {
        showMessage("请先点名一个学生。");
    }
}

//每次返回页面或者重新点名使星星恢复原始形态
function resetStars() {   
    document.querySelectorAll('.rating input').forEach(star => {  
        star.checked = false; // 取消选中状态  
    });  
} 

// 禁用所有星星选择
function disableStars() {
    document.querySelectorAll('.rating input').forEach(star => {
        star.disabled = true;
    });
}

// 启用所有星星选择
function enableStars() {
    document.querySelectorAll('.rating input').forEach(star => {
        star.disabled = false;
    });
}

function resetAllPoints() {
    students.forEach(student => student.points = 0);
    localStorage.setItem('students', JSON.stringify(students));
    localStorage.removeItem('selectedStudent');
    selectedStudent = null;
    document.getElementById('selectedStudent').innerText = '';
    showMessage("所有积分已重置！");
}

//弹窗
const fileButton = document.getElementById('fileButton');  
const uploadModal = document.getElementById('uploadModal');  
const closeButton = document.getElementById('closeButton');  

fileButton.addEventListener('click',function() {
    uploadModal.style.display = 'block'; // 显示模态框
});

closeButton.addEventListener('click', function() {  
    resetUpload();
    uploadModal.style.display = 'none'; // 关闭模态框  
});  

window.addEventListener('click', function(event) {  
    if (event.target === uploadModal) {  
        uploadModal.style.display = 'none'; // 点击模态框外部关闭  
    }  
});  

const uploadBox = document.getElementById('uploadBox');  
const fileInput = document.getElementById('fileInput');  

uploadBox.addEventListener('click', function() {  
    fileInput.click();  
});  

uploadBox.addEventListener('dragover', function(event) {  
    event.preventDefault();  
    uploadBox.style.borderColor = '#4CAF50';  
});  

uploadBox.addEventListener('dragleave', function() {  
    uploadBox.style.borderColor = '#ccc';  
});  

uploadBox.addEventListener('drop', function(event) {  
    event.preventDefault();  
    uploadBox.style.borderColor = '#ccc';  
    const files = event.dataTransfer.files; 
    if (files.length > 0) { 
        const fileName = files[0].name; // 获取文件名
        const uploadText = document.getElementById('uploadText');
        const excelLogo = '📊'; // Excel 图标，可以使用 emoji，也可以使用图像 URL

        // 替换内容
        uploadText.innerHTML = `${excelLogo} ${fileName}`;
        document.querySelector('.pic').style.display = 'none'; // 隐藏箭头 
        showMessage('已选择文件: ' + files[0].name);  

        // 将文件设置到 fileInput 中，以便 OK 按钮可以获取到
        fileInput.files = files;
    }  
});  

fileInput.addEventListener('change', function(event) {  
    const file = event.target.files[0];  
    if (file) {  
        const fileName = file.name; // 获取文件名
        const uploadText = document.getElementById('uploadText');
        const excelLogo = '📊'; // Excel 图标，可以使用 emoji，也可以使用图像 URL

        // 替换内容
        uploadText.innerHTML = `${excelLogo} ${fileName}`;
        document.querySelector('.pic').style.display = 'none'; // 隐藏箭头
        showMessage('已选择文件: ' + file.name);  
    }  
});  

document.getElementById('cancelButton').addEventListener('click', function() { 
    resetUpload(); 
    fileInput.value = '';  
    uploadModal.style.display = 'none'; // 取消时关闭模态框  
    showMessage('已取消选择');  
});  

document.getElementById('okButton').addEventListener('click', function() {  
    const input = document.getElementById('fileInput');  
    const file = input.files[0];  // 获取选中的文件 
    
    if (!file) {  
        showMessage('请先选择文件');  
    } else {  
        showMessage('文件导入成功: ' + file.name);  
        uploadFile();  // 调用上传文件的函数  
        uploadModal.style.display = 'none'; // 关闭模态框  
    }  
    resetUpload();
});

// 重置上传状态的函数
function resetUpload() {
    document.getElementById('fileInput').value = ''; // 清空文件输入
    document.getElementById('uploadText').innerHTML = '点击或拖拽文件到此处上传'; // 恢复提示文本
    document.querySelector('.pic').style.display = 'block'; // 显示箭头
}