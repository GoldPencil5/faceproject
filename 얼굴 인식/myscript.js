const video = document.getElementById('video');
const canvas = document.createElement('canvas');
const startButton = document.getElementById('startButton');
const excelBtn = document.getElementById('excelBtn');
const table = document.querySelector('table tbody');
const img = document.createElement('img');
let isCanvasCreated = false;

Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri('/weights'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/weights'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/weights'),
]).then(startFaceRecognition);

async function startVideo() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  video.play();
}

function cap() // 캡처 함수
{
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height); // 캡처한 이미지 그리기
}

function Picture() // 사진 캡처 버튼이 클릭될 경우 실행되는 함수
{
    if (!isCanvasCreated) // 최초 캔버스 생성
    {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        isCanvasCreated = true;
    }

    cap(); // 캡처한 이미지 그리기
    img.src = canvas.toDataURL(); // 캔버스에서 그린 이미지를 img 요소의 src 속성에 할당

    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="2"><img src="${img.src}" /></td>`; // tr 요소 생성 및 추가

    const firstRow = table.querySelector('tr:first-child');
    table.replaceChild(tr, firstRow); // 테이블 첫 번째 행 tr로 대체
}

async function startFaceRecognition() {
  startVideo();
  
    const labeledFaceDescriptors = await loadLabeledImages(); // 학습한 데이터 받아온 후
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
    attendBtn.addEventListener('click', async () => 
    {   
        const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors(); // 얼굴 인식
        const results = detections.map(d => faceMatcher.findBestMatch(d.descriptor)); // 인식된 얼굴과 일치하는 라벨 찾기
        const labels = results.map(r => r.label);

        if (labels.length > 0) // 일치하는 라벨이 있는 경우
        {
            for (let i = 0; i < labels.length; i++)
            {
                const label = labels[i];

                if (label == "unknown") continue;

                const tr = table.querySelector(`tr[data-name="${label}"]`); // label에 해당하는 사람의 출석표에 O 텍스트 삽입
                const td = tr.querySelector('td:last-child');
                td.textContent = 'o';
            }
        }
    });
}

function loadLabeledImages() // 인물 학습
{
    const labels = ['hwan', 'in', 'gold']
    return Promise.all(
        labels.map(async label => {
            const descriptions = []
            for (let i = 1; i <= 5; i++) // 5장의 사진 학습
            {
                const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/GoldPencil5/facemodel/main/face/${label}/${i}.jpg`)
                /* 라이브 서버에서는 일반적으로 폴더 내부의 파일에 직접 접근할 수 없습니다.
                따라서 원격 서버에 있는 이미지를 가져오는 방법을 사용해야 합니다. */
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
                descriptions.push(detections.descriptor)
            }
            return new faceapi.LabeledFaceDescriptors(label, descriptions)
        })
    )
}

function createExcel() // 엑셀 생성 버튼 클릭 시 실행되는 함수
{
    const workbook = XLSX.utils.book_new(); // 엑셀 파일 생성
    const sheet = XLSX.utils.table_to_sheet(table); // 시트 생성
    XLSX.utils.book_append_sheet(workbook, sheet, 'Attendance'); // 시트를 워크북에 추가
    XLSX.writeFile(workbook, 'attendance.xlsx'); // 엑셀 파일 다운로드

    /** 출석표 공백으로 초기화 **/
    const tr1 = table.querySelector(`tr[data-name="hwan"]`);
    const td1 = tr1.querySelector('td:last-child');
    td1.textContent = '';
    const tr2 = table.querySelector(`tr[data-name="in"]`);
    const td2 = tr2.querySelector('td:last-child');
    td2.textContent = '';
    const tr3 = table.querySelector(`tr[data-name="gold"]`);
    const td3 = tr3.querySelector('td:last-child');
    td3.textContent = '';
    /** 출석표 공백으로 초기화 **/
}

captureButton.addEventListener('click', Picture);
excelBtn.addEventListener('click', createExcel);
