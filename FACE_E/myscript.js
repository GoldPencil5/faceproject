const video = document.getElementById('video');
const canvas = document.createElement('canvas');
const captureButton = document.getElementById('captureButton');
const excelBtn = document.getElementById('excelBtn');
const table = document.querySelector('table tbody');
const img = document.createElement('img');
const decodedPath = decodeURIComponent('/%EC%96%BC%EA%B5%B4%20%EC%9D%B8%EC%8B%9D');
const attendBtn = document.getElementById('attendBtn');
console.log(decodedPath);
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

navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    const video = document.getElementById('video');
    video.srcObject = stream;
    video.play();
  })
  .catch(error => {
    console.error('Unable to access the camera: ', error);
  });

function cap() 
{
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height); 
}

function Picture() 
{
    if (!isCanvasCreated) 
    {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        isCanvasCreated = true;
    }

    cap(); 
    img.src = canvas.toDataURL();

    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="2"><img src="${img.src}" /></td>`; 

    const firstRow = table.querySelector('tr:first-child');
    table.replaceChild(tr, firstRow); 
}

async function startFaceRecognition() {
  startVideo();
  
    const labeledFaceDescriptors = await loadLabeledImages(); 
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
    attendBtn.addEventListener('click', async () => 
    {   
        const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors(); 
        const results = detections.map(d => faceMatcher.findBestMatch(d.descriptor)); 
        const labels = results.map(r => r.label);

        if (labels.length > 0)
        {
            for (let i = 0; i < labels.length; i++)
            {
                const label = labels[i];

                if (label == "unknown") continue;

                const tr = table.querySelector(`tr[data-name="${label}"]`); 
                const td = tr.querySelector('td:last-child');
                td.textContent = '출석';
            }
        }
    });
  
}

function loadLabeledImages() 
{
    const labels = ['hwan', 'in', 'gold']
    return Promise.all(
        labels.map(async label => {
            const descriptions = []
            for (let i = 1; i <= 5; i++) 
            {
                const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/GoldPencil5/facemodel/main/face/${label}/${i}.jpg`)
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
                descriptions.push(detections.descriptor)
            }
            return new faceapi.LabeledFaceDescriptors(label, descriptions)
        })
    )
}

function createExcel() 
{
    const workbook = XLSX.utils.book_new();


const sheet = XLSX.utils.aoa_to_sheet([
  ["name", "attendance"],
  ["권동환", ""],
  ["권승인", ""],
  ["금경필", ""]
]);

XLSX.utils.book_append_sheet(workbook, sheet, 'Attendance');

XLSX.writeFile(workbook, 'anu_stud_att.xlsx');

const attendees = [
  { name: "권동환", attendance: "" },
  { name: "권승인", attendance: "" },
  { name: "금경필", attendance: "" }
];

attendees.forEach((attendee) => {
  const tr = table.querySelector(`tr[data-name="${attendee.name}"]`);
  const td = tr.querySelector('td:last-child');
  td.textContent = attendee.attendance;
});
}

captureButton.addEventListener('click', Picture);
attendBtn.addEventListener('click', startFaceRecognition);
excelBtn.addEventListener('click', createExcel);
