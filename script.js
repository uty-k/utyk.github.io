const attiImg = new Image();
// attiImg.src = '속성아이콘.png'; // 이 줄은 이제 필요 없습니다.

const atkadkImg = new Image();
atkadkImg.src = '공격력체력아이콘.png';

const hpImg = new Image();
hpImg.src = '유닛체력아이콘.png';

// 카드 종류별 및 몬스터 타입별 프레임 이미지 로드 및 관리 --
const monsterFrameImg = new Image();
let currentMonsterFrameSrc = ''; // 현재 몬스터 프레임 소스를 저장하는 변수

const spellFrameImg = new Image();
spellFrameImg.src = '프레임_마법.png';

const itemFrameImg = new Image();
itemFrameImg.src = '프레임_함정.png';

const buildFrameImg = new Image();
buildFrameImg.src = '프레임_구조물.png';

function updateMonsterFrame(monsterType) {
    let newSrc = '';
    switch (monsterType) {
        case 'normal':
            newSrc = '프레임_몬스터.png';
            break;
        case 'beast':
            newSrc = '프레임_수인.png';
            break;
        case 'spirit':
            newSrc = '프레임_정령.png';
            break;
        case 'dragon':
            newSrc = '프레임_용족.png';
            break;
        case 'witch':
            newSrc = '프레임_마녀.png';
            break;
        case 'elf':
            newSrc = '프레임_엘프.png';
            break;
        case 'fairy':
            newSrc = '프레임_요정.png';
            break;
        case 'ghost':
            newSrc = '프레임_유령.png';
            break;
        default:
            newSrc = '프레임_몬스터.png'; // 기본 몬스터 프레임 (선택된 타입이 없을 경우)
            break;
    }

    if (currentMonsterFrameSrc !== newSrc) {
        monsterFrameImg.src = newSrc;
        currentMonsterFrameSrc = newSrc;
        // 이미지가 로드되면 카드를 다시 그립니다.
        monsterFrameImg.onload = drawCard; 
    } else if (!monsterFrameImg.complete) {
        // 이미지가 로딩 중이거나 로드되지 않았을 때 명시적으로 다시 그립니다.
        drawCard();
    }
}

// 필요한 HTML 요소들을 가져옵니다.
const cardTypeRadios = document.querySelectorAll('input[name="card-type"]');
const hpInput = document.getElementById('card-hp');
const attributeSelect = document.getElementById('card-attribute');
const monsterTypeSelect = document.getElementById('monster-type-select');
const nameInput = document.getElementById('card-name');
const imageInput = document.getElementById('card-image');

// 상단 효과 입력 필드 요소 추가
const topDescriptionInput = document.getElementById('card-top-description');

const descriptionInput = document.getElementById('card-description');
const downloadBtn = document.getElementById('download-btn');
const monsterSpecificOptionsDiv = document.getElementById('monster-specific-options');
const labelMonsterType = document.getElementById('label-monster-type');

const saveCardBtn = document.getElementById('save-card-btn');
const loadCardSelect = document.getElementById('load-card-select');
const deleteCardBtn = document.getElementById('delete-card-btn');
const searchCardInput = document.getElementById('search-card-input'); // 검색창 요소 추가

// 순서 조정 버튼 요소 추가
const moveUpBtn = document.getElementById('move-up-btn');
const moveDownBtn = document.getElementById('move-down-btn');

// JSON 파일 저장/불러오기 요소 추가
const exportListBtn = document.getElementById('export-list-btn');
const importListInput = document.getElementById('import-list-input');
// 목록 이름 입력 필드
const listNameInput = document.getElementById('list-name-input');

const canvas = document.getElementById('card-canvas');
const ctx = canvas.getContext('2d');

let userImage = null;
let userImageBase64 = null; // 이미지 데이터를 Base64로 저장하기 위한 변수

// ===========================================
// ⭐ 텍스트 색상 변경을 위한 헬퍼 함수 추가 시작
// ===========================================

const COLOR_MAP = {
    's': '#715596', //스트레스
    'gx': '#84bdff', //일회용
    'g': '#7affed', //지속 능력
    'h': '#a8ffa0', //회복
    'ru': '#ffe884', //라운드
    'r2': '#89a5ff', //절반
    're': '#f5ff6a', //분배
    'ra': '#a0c1ff', //무작위
    'w': '#b8c2cf', //이동
    'w1': '#fcad54', //물리 피해
    'w2': '#7f69fd', //마법 피해
    'e1': '#ffee50', //요정
    'e2': '#f59760', //수인
    'e3': '#6b8dff', //엘프
    'e4': '#75db6c', //정령
    'e5': '#dc60f5', //유령
    'e6': '#d7e4f5', //용족
    'e7': '#ad60f5', //마녀
    'a1': '#6ff562', //순수
    'a2': '#31aafa', //광기
    'a3': '#f74437', //냉정
    'a4': '#f8f541', //활발
    'a5': '#39275a', //우울
    'd': '#f0f0f0', //고정 숫자
    'd2': '#d2f6ff', //D2
    'd3': '#cb62f5', //D3
    'd4': '#a3bacc', //D4
    'd6': '#48cf0a', //D6
    'd8': '#208ee9', //D8
    'd10': '#e9d520', //D10
    'd12': '#e99220', //D12
    'd20': '#e92020', //D20
    't': '#fab86c', //아군 또는 자신
    'r': '#df3330', //적
    'hp': '#fc645f', //체력
    'str': '#ff7575', //강화
    'res': '#b3b3b3', //저항
};

/**
 * 텍스트를 색상 태그 [color text/color] 기준으로 분리하는 함수로 수정됨
 * @param {string} text - 원본 텍스트
 * @param {string} defaultColor - 태그가 없는 부분에 사용할 기본 색상
 * @returns {Array<{text: string, color: string}>} - 분리된 텍스트 세그먼트 배열
 */
function parseTextSegments(text, defaultColor = 'white') {
    const segments = [];
    // 태그 패턴: \[([#\w]+)(.*?)\/\1\] - [colorName content/colorName] 형식 지원
    // #1E90FF와 같은 Hex 코드도 허용하기 위해 \w+ 대신 [#\w]+ 사용
    const regex = /\[([#\w]+)(.*?)\/\1\]/g; 
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        // 1. 태그 이전의 일반 텍스트
        if (match.index > lastIndex) {
            segments.push({ text: text.substring(lastIndex, match.index), color: defaultColor });
        }
        
        // 2. 태그로 감싸진 색상 텍스트 (match[1] = color_name or hex code, match[2] = content)
        const colorKey = match[1];
        // 맵에 키가 있으면 맵의 색상을 사용하고, 없으면 키 자체(Hex 코드)를 색상으로 사용
        const finalColor = COLOR_MAP[colorKey.toLowerCase()] || colorKey; 
        segments.push({ text: match[2], color: finalColor });

        lastIndex = regex.lastIndex;
    }

    // 3. 마지막 태그 이후의 일반 텍스트
    if (lastIndex < text.length) {
        segments.push({ text: text.substring(lastIndex), color: defaultColor });
    }

    return segments;
}

/**
 * 버퍼에 저장된 세그먼트 리스트를 중앙 정렬하여 캔버스에 그리는 헬퍼 함수
 * @param {Array<{text: string, color: string}>} buffer - 그릴 세그먼트 목록
 * @param {number} centerX - 중앙 정렬 기준 X 좌표
 * @param {number} y - Y 좌표
 * @param {string} defaultColor - 기본 색상
 */
function drawBufferLine(buffer, centerX, y, defaultColor) {
    let lineTotalWidth = 0;
    // 1. 전체 너비 계산 (좌측 정렬 기준으로)
    ctx.textAlign = 'left'; 
    buffer.forEach(seg => {
        // 빈 문자열은 측정하지 않음
        if (seg.text.length > 0) {
             lineTotalWidth += ctx.measureText(seg.text).width;
        }
    });

    // 2. 중앙 정렬을 위해 시작 X 좌표 계산
    let currentX = centerX - (lineTotalWidth / 2);

    // 3. 순차적으로 그리기
    buffer.forEach(seg => {
        // 텍스트가 없으면 그리지 않고 건너뜁니다.
        if (seg.text.length === 0) return;

        // 색상 설정
        ctx.fillStyle = seg.color || defaultColor;

        // 외곽선 그리기 
        ctx.strokeText(seg.text, currentX, y);
        
        // 텍스트 그리기
        ctx.fillText(seg.text, currentX, y);

        // 다음 텍스트 시작 위치 업데이트
        currentX += ctx.measureText(seg.text).width;
    });
    // 다음 텍스트가 중앙 정렬로 그려질 수 있도록 'center'로 복원합니다.
    ctx.textAlign = 'center';
}

// ===========================================
// ⭐ 텍스트 색상 변경을 위한 헬퍼 함수 추가 끝
// ===========================================


// 텍스트 수동 줄바꿈 및 크기 조정 함수 (색상 처리 로직 통합)
// 반환값: 텍스트가 차지하는 총 줄 수
function wrapText(text, x, y, maxWidth, lineHeight, fontSize, defaultColor = 'white') {
    const lines = text.split('\n');
    ctx.textAlign = 'center';
    ctx.font = `bold ${fontSize}px "Noto Sans KR"`;
    ctx.fillStyle = defaultColor; // 기본 색상 설정
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;

    let totalLinesDrawn = 0; // 실제로 그려진 줄 수를 카운트할 변수
    let currentY = y; 

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const segments = parseTextSegments(line, defaultColor); // 색상 태그를 기준으로 분리

        let currentLineBuffer = [];
        let currentLineWidth = 0;

        for (let j = 0; j < segments.length; j++) {
            const segment = segments[j];
            // 텍스트 내용 전체를 단어로 간주하거나, 공백으로 분리된 경우를 대비하여 분리합니다.
            // 그러나 새로운 태그 형식에서는 태그 내에 공백이 있을 가능성이 적으므로 
            // 태그 내부의 내용을 하나의 덩어리로 처리하는 것이 안전할 수 있습니다.
            // 기존 로직을 유지하면서, 태그 내부의 공백은 하나의 텍스트로 처리되도록 합니다.

            // 여기서는 기존의 띄어쓰기 기반의 줄바꿈 로직을 사용합니다.
            const words = segment.text.split(' ');
            const segmentColor = segment.color || defaultColor;

            for (let n = 0; n < words.length; n++) {
                const word = words[n];
                // 단어 뒤에 붙일 공백 처리: 현재 세그먼트의 마지막 단어가 아니거나, 전체 세그먼트의 마지막 단어가 아니면 공백 추가
                const isLastWordOfSegment = n === words.length - 1;
                const isLastSegment = j === segments.length - 1;
                const space = (isLastWordOfSegment && isLastSegment) ? '' : ' ';

                const testText = word + space;
                const testWidth = ctx.measureText(testText).width;
                
                // 단어가 없는데 공백이 있는 경우 (연속 공백이나 세그먼트 경계의 공백)는 너비만 처리
                if (word.length === 0) {
                    currentLineBuffer.push({ text: space, color: segmentColor });
                    currentLineWidth += testWidth;
                    continue; 
                }

                
                // 줄 바꿈 조건: 현재 줄에 내용이 있고, 새 단어를 추가하면 maxWidth를 초과할 때
                if (currentLineWidth + testWidth > maxWidth && currentLineWidth > 0) {
                    // **줄 바꿈 발생:** 현재 버퍼에 있는 내용을 그립니다.
                    drawBufferLine(currentLineBuffer, x, currentY, defaultColor);

                    // 줄 수 업데이트 및 Y 위치 이동
                    totalLinesDrawn++;
                    currentY += lineHeight;
                    currentLineWidth = 0;
                    currentLineBuffer = [];
                }
                
                // 단어와 색상 정보를 버퍼에 추가
                currentLineBuffer.push({ text: testText, color: segmentColor });
                currentLineWidth += testWidth;
            }
        }
        
        // **\n으로 구분된 줄의 마지막 남은 버퍼 내용을 그립니다.**
        if (currentLineBuffer.length > 0) {
            drawBufferLine(currentLineBuffer, x, currentY, defaultColor);
            totalLinesDrawn++;
            currentY += lineHeight;
        } else if (line.length === 0 && i < lines.length - 1) { 
             // 빈 줄 (\n\n) 처리 (마지막 줄이 아닌 경우에만)
             totalLinesDrawn++;
             currentY += lineHeight;
        }
    }
    
    // 이 함수가 반환하는 값: 실제로 그려진 총 줄 수
    return totalLinesDrawn; 
}


// 속성 아이콘 이미지를 로드하는 함수 추가
function updateAttiImage(attributeValue) {
    if (attributeValue === 'no-attribute') { // 속성 없음 선택 시
        attiImg.src = ''; // 이미지 소스 비우기
        drawCard();
        return;
    }

    // (기존 로직 유지)
    let imgSrc = '속성아이콘_땅.png';
    // ... (이하 기존 switch/case 로직)
    switch (attributeValue) {
        case '#DC143C': imgSrc = '속성아이콘_물.png'; break;
        case '#1E90FF': imgSrc = '속성아이콘_화염.png'; break;
        case '#228B22': imgSrc = '속성아이콘_바람.png'; break;
        case '#FFD700': imgSrc = '속성아이콘_빛.png'; break;
        case '#4B0082': imgSrc = '속성아이콘_어둠.png'; break;
        case '#8A2BE2':
        default: imgSrc = '속성아이콘_땅.png'; break;
    }

    if (attiImg.src !== window.location.origin + '/' + imgSrc) {
        attiImg.src = imgSrc;
        attiImg.onload = drawCard;
    } else {
        drawCard();
    }
}

function drawCard() {
    const cardType = document.querySelector('input[name="card-type"]:checked').value;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (userImage) {
        // 카드 종류에 따른 이미지 그리기 로직 분리: 1:1 비율 및 상단 정렬 적용
        if (cardType === 'spell' || cardType === 'item') {
            // 능력/아이템 카드는 중앙에 1:1 비율로 이미지를 배치
            const imageSize = 380; // 이미지의 가로/세로 크기 (캔버스 400px - 좌우 여백 10px씩)
            const startX = 10;
            const startY = 10; // 이미지를 카드 상단에 붙도록 Y 시작점을 10px로 조정
            
            // 이미지 그릴 영역을 흰색으로 먼저 채워서 배경으로 사용
            ctx.fillStyle = '#ffffff'; 
            ctx.fillRect(startX, startY, imageSize, imageSize);
            
            // 이미지 그리기
            ctx.drawImage(userImage, startX, startY, imageSize, imageSize);

        } else {
            // 유닛/전장 카드는 기존처럼 캔버스 전체에 이미지를 배치 (400x560)
            ctx.drawImage(userImage, 0, 0, canvas.width, canvas.height);
        }
    } else {
        ctx.fillStyle = '#888';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('이미지를 업로드하세요', canvas.width / 2, canvas.height / 2);
    }

    if (cardType === 'monster') {
        ctx.drawImage(monsterFrameImg, 0, 0, canvas.width, canvas.height);
    } else if (cardType === 'spell') {
        ctx.drawImage(spellFrameImg, 0, 0, canvas.width, canvas.height);
    } else if (cardType === 'item') {
        ctx.drawImage(itemFrameImg, 0, 0, canvas.width, canvas.height);
    } else if (cardType === 'build') {
        ctx.drawImage(buildFrameImg, 0, 0, canvas.width, canvas.height);
    }

    // 유닛(monster)일 때만 체력 아이콘 및 속성/스탯 아이콘을 그립니다.
    if (cardType === 'monster') {
        // 유닛 체력 아이콘 (좌측 상단 코스트/HP 위치)
        ctx.drawImage(hpImg, 0, 0, canvas.width, canvas.height); 
        // 몬스터 속성 아이콘
        ctx.drawImage(attiImg, 0, 0, canvas.width, canvas.height);
    }
    
    // ⭐ 카드 종류에 따른 상단 효과 텍스트 그리기 (색상 처리 로직 통합)
    if (cardType !== '' && topDescriptionInput.value.trim() !== '') {
        const topText = topDescriptionInput.value;
        const maxTopTextWidth = 340; // 상단 텍스트 최대 너비
        const topTextLineHeight = 24;
        const topTextFontSize = 20;
        const defaultColor = 'white'; // 상단 텍스트 기본 색상
        
        ctx.textAlign = 'center';
        ctx.font = `bold ${topTextFontSize}px "Noto Sans KR"`;
        ctx.fillStyle = defaultColor; 
        ctx.strokeStyle = 'black'; 
        ctx.lineWidth = 4;
        
        const lines = topText.split('\n');
        let currentY = 35; // 상단에서 시작 Y 위치 (프레임 내부에 맞춰 조정)
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // 1. 색상 태그를 기준으로 텍스트를 분리합니다.
            const segments = parseTextSegments(line, defaultColor);

            // 2. 각 라인별로 단어 단위 줄 바꿈 로직 수행
            let currentLineBuffer = [];
            let currentLineWidth = 0;

            for (let j = 0; j < segments.length; j++) {
                const segment = segments[j];
                const words = segment.text.split(' ');
                const segmentColor = segment.color || defaultColor;

                for (let n = 0; n < words.length; n++) {
                    const word = words[n];
                    const isLastWordOfSegment = n === words.length - 1;
                    const isLastSegment = j === segments.length - 1;
                    const space = (isLastWordOfSegment && isLastSegment) ? '' : ' ';

                    const testText = word + space;
                    const testWidth = ctx.measureText(testText).width;
                    
                    // 단어가 없는데 공백이 있는 경우 처리
                    if (word.length === 0) {
                        currentLineBuffer.push({ text: space, color: segmentColor });
                        currentLineWidth += testWidth;
                        continue; 
                    }

                    
                    // 줄 바꿈 조건: 현재 줄에 내용이 있고, 새 단어를 추가하면 maxWidth를 초과할 때
                    if (currentLineWidth + testWidth > maxTopTextWidth && currentLineWidth > 0) {
                        // **줄 바꿈 발생:** 현재 버퍼에 있는 내용을 그립니다.
                        drawBufferLine(currentLineBuffer, canvas.width / 2, currentY, defaultColor);
                        currentY += topTextLineHeight;
                        currentLineWidth = 0;
                        currentLineBuffer = [];
                    }
                    
                    // 단어와 색상 정보를 버퍼에 추가
                    currentLineBuffer.push({ text: testText, color: segmentColor });
                    currentLineWidth += testWidth;
                }
            }
            
            // 현재 \n 줄의 남은 내용을 그립니다.
            if (currentLineBuffer.length > 0) {
                drawBufferLine(currentLineBuffer, canvas.width / 2, currentY, defaultColor);
            }

            // 다음 줄로 이동
            currentY += topTextLineHeight;
        }
    }


    // --- Y 위치 계산 로직 ---
    const lineHeight = 30;
    const cardNameBaseY = 376; // 카드 이름의 새로운 기본 Y 위치 (이미지 아래)
    const effectBaseY = 418;   // 효과 텍스트의 새로운 기본 시작 Y 위치 (이름 아래)
    
    const maxEffectWidth = 340;
    const effectFontSize = 20;
    const maxAllowedLines = 5; // ⭐ 5줄로 수정됨: 5줄까지는 움직이지 않음

    // ⭐ 1. 텍스트 줄 수 계산 (실제로 그리지 않고 측정만 함) - 색상 처리 로직 추가
    const tempCtx = canvas.getContext('2d');
    tempCtx.font = `bold ${effectFontSize}px "Noto Sans KR"`;
    const defaultEffectColor = 'white';
    let totalLinesCount = 0;
    const effectLines = descriptionInput.value.split('\n');

    for (let i = 0; i < effectLines.length; i++) {
        const line = effectLines[i];
        const segments = parseTextSegments(line, defaultEffectColor); // 색상 태그를 기준으로 분리

        let currentLineBuffer = [];
        let currentLineWidth = 0;
        let lineHadContent = false;

        for (let j = 0; j < segments.length; j++) {
            const segment = segments[j];
            const words = segment.text.split(' ');
            
            for (let n = 0; n < words.length; n++) {
                const word = words[n];
                const isLastWordOfSegment = n === words.length - 1;
                const isLastSegment = j === segments.length - 1;
                const space = (isLastWordOfSegment && isLastSegment) ? '' : ' ';

                const testText = word + space;
                
                // 단어가 없는데 공백이 있는 경우 처리
                if (word.length === 0) {
                    currentLineWidth += tempCtx.measureText(space).width;
                    continue; 
                }

                const testWidth = tempCtx.measureText(testText).width;
                
                // 줄 바꿈 조건: 현재 줄에 내용이 있고, 새 단어를 추가하면 maxWidth를 초과할 때
                if (currentLineWidth + testWidth > maxEffectWidth && currentLineWidth > 0) {
                    totalLinesCount++;
                    currentLineWidth = 0;
                }
                
                currentLineWidth += testWidth;
                lineHadContent = true;
            }
        }
        
        // \n으로 구분된 줄의 마지막 남은 내용 처리 (내용이 있거나 빈 줄이 명시된 경우)
        if (currentLineWidth > 0 || line.length === 0) {
            totalLinesCount++;
        }
    }
    
    // 2. 이동 거리 계산
    let linesToShift = 0;
    if (totalLinesCount > maxAllowedLines) {
        linesToShift = totalLinesCount - maxAllowedLines;
    }
    const shiftDistance = linesToShift * lineHeight; // 이동해야 할 픽셀 거리
    
    const finalCardNameY = cardNameBaseY - shiftDistance;
    const finalEffectY = effectBaseY - shiftDistance;
    
    // 3. 카드 이름 그리기 (finalCardNameY 적용)
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 8;

    let cardName = nameInput.value;
    let fontSize = 36;
    const maxNameWidth = 220;
    while (fontSize > 22 && ctx.measureText(cardName).width > maxNameWidth) {
        fontSize -= 1;
        ctx.font = `900 ${fontSize}px "Noto Sans KR"`;
    }
    ctx.font = `900 ${fontSize}px "Noto Sans KR"`;
    ctx.strokeText(cardName, canvas.width / 2, finalCardNameY);
    ctx.fillText(cardName, canvas.width / 2, finalCardNameY);


    // ⭐ 4. 카드 효과 그리기 (finalEffectY 적용) - 기본 색상 'white' 전달
    wrapText(descriptionInput.value, canvas.width / 2, finalEffectY, maxEffectWidth, lineHeight, effectFontSize, 'white');


    // 5. 코스트 및 ATK/HP 그리기
    ctx.font = 'bold 38px "Noto Sans KR"';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';

    if (cardType === 'monster') {
        // HP (좌측 상단)
        ctx.strokeText(hpInput.value, 51, 60);
        ctx.fillText(hpInput.value, 51, 60);
    }
    

}

// === 저장 및 불러오기 기능 (Local Storage 유지) ===

// ⭐ saveCard 함수: 업데이트 시 최초 등록 ID를 유지하도록 수정 및 용량 체크 로직 추가
function saveCard() {
    const cardName = nameInput.value.trim();
    if (!cardName) {
        alert('카드 이름을 입력해주세요.');
        return;
    }
    let cards = JSON.parse(localStorage.getItem('savedCards')) || [];
    
    // 기존 카드를 찾습니다.
    const existingCardIndex = cards.findIndex(card => card.name === cardName);
    
    let cardId;
    if (existingCardIndex > -1) {
        // 1. 기존 카드가 있으면 그 카드의 최초 ID를 사용합니다.
        cardId = cards[existingCardIndex].id;
    } else {
        // 2. 새 카드라면 현재 시간을 ID로 부여합니다.
        cardId = Date.now();
    }
    
    // 업데이트 또는 신규 저장될 카드의 최종 데이터
    const finalCardData = {
        id: cardId, // ID는 최초 등록 시 부여된 값을 유지
        name: cardName,
        cardType: document.querySelector('input[name="card-type"]:checked').value,
        hp: hpInput.value,
        attribute: attributeSelect.value,
        monsterType: monsterTypeSelect.value,

        topDescription: topDescriptionInput.value,
        
        description: descriptionInput.value,
        imageData: userImageBase64
    };

    if (existingCardIndex > -1) {
        cards[existingCardIndex] = finalCardData; // 기존 데이터 업데이트 (ID 유지)
    } else {
        cards.push(finalCardData); // 새 카드 추가
    }
    
    // **[핵심] 저장 전 Local Storage 용량 초과 체크 로직**
    try {
        localStorage.setItem('savedCards', JSON.stringify(cards));
        
        if (existingCardIndex > -1) {
            alert(`'${cardName}' 카드를 업데이트했습니다.`);
        } else {
            alert(`'${cardName}' 카드를 저장했습니다.`);
        }
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            alert('❌ 저장 실패: 브라우저 Local Storage 용량 제한에 도달했습니다.\n오래된 카드를 삭제하거나, "전체 카드 목록 다운로드" 기능을 이용해 백업해주세요.');
            // 실패했으므로, cards 배열을 원래 상태로 되돌립니다.
            if (existingCardIndex === -1) {
                cards.pop();
            } else {
                // 이 부분은 복잡하므로 간단히 경고만 띄우고 종료합니다.
            }
            return; 
        } else {
            alert(`카드 저장 중 오류가 발생했습니다: ${e.message}`);
            return;
        }
    }
    
    localStorage.setItem('savedCards', JSON.stringify(cards));
    updateCardListUI(); // 함수 이름 변경
}


// ⭐ loadCards 함수를 updateCardListUI로 변경 및 목록 역순 정렬 추가
function updateCardListUI(searchTerm = '') {
    const cards = JSON.parse(localStorage.getItem('savedCards')) || [];
    loadCardSelect.innerHTML = '<option value="">-- 카드 선택 --</option>';

    // 요청에 따라 카드 목록을 역순으로 표시합니다.
    const reversedCards = [...cards].reverse(); 
    
    const filteredCards = reversedCards.filter(card => 
        card.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filteredCards.forEach((card) => {
        const option = document.createElement('option');
        option.value = card.id;
        option.textContent = card.name;
        loadCardSelect.appendChild(option);
    });
}

function displayCard(cardId) {
    const cards = JSON.parse(localStorage.getItem('savedCards')) || [];
    // ID를 기준으로 찾습니다.
    const cardToLoad = cards.find(card => card.id == cardId); 
    if (cardToLoad) {
        nameInput.value = cardToLoad.name;
        hpInput.value = cardToLoad.hp;
        attributeSelect.value = cardToLoad.attribute;
        monsterTypeSelect.value = cardToLoad.monsterType;
        
        // ⭐ [추가] 상단 효과 텍스트 불러오기 (하위 호환성을 위해 || '' 처리)
        topDescriptionInput.value = cardToLoad.topDescription || ''; 
        
        descriptionInput.value = cardToLoad.description;
        document.querySelector(`input[name="card-type"][value="${cardToLoad.cardType}"]`).checked = true;
        const isMonster = cardToLoad.cardType === 'monster';
        monsterSpecificOptionsDiv.style.display = isMonster ? 'flex' : 'none';
        if (cardToLoad.imageData) {
            userImageBase64 = cardToLoad.imageData;
            userImage = new Image();
            userImage.onload = () => {
                updateAttiImage(cardToLoad.attribute);
                updateMonsterFrame(cardToLoad.monsterType);
            };
            userImage.src = cardToLoad.imageData;
        } else {
            userImage = null;
            userImageBase64 = null;
            updateAttiImage(cardToLoad.attribute);
            updateMonsterFrame(cardToLoad.monsterType);
        }
    }
}

function deleteCard() {
    const selectedCardId = loadCardSelect.value;
    if (!selectedCardId) {
        alert('삭제할 카드를 선택해주세요.');
        return;
    }

    const selectedCardName = loadCardSelect.options[loadCardSelect.selectedIndex].text;
    if (!confirm(`'${selectedCardName}' 카드를 정말로 삭제하시겠습니까?`)) {
        return; 
    }

    let cards = JSON.parse(localStorage.getItem('savedCards')) || [];
    const initialLength = cards.length;
    cards = cards.filter(card => card.id != selectedCardId);
    if (cards.length < initialLength) {
        localStorage.setItem('savedCards', JSON.stringify(cards));
        alert('선택된 카드를 삭제했습니다.');
        updateCardListUI(); // 함수 이름 변경
        nameInput.value = '';
        hpInput.value = '0';
        attributeSelect.value = '#8A2BE2';
        monsterTypeSelect.value = 'effect';
        
        // ⭐ [추가] 상단 효과 필드 초기화
        topDescriptionInput.value = '';
        
        descriptionInput.value = '';
        hpInput.value = '0'; // 체력 입력 필드 초기화
        userImage = null;
        userImageBase64 = null;
        document.querySelector('input[name="card-type"][value="monster"]').checked = true;
        // monsterStatsDiv.style.display = 'flex'; // 제거된 변수
        monsterSpecificOptionsDiv.style.display = 'flex';
        drawCard();
    } else {
        alert('카드를 찾을 수 없거나 삭제에 실패했습니다.');
    }
}

// ⭐ 순서 변경 로직 함수 추가
function moveCard(direction) {
    const selectedOption = loadCardSelect.options[loadCardSelect.selectedIndex];
    if (loadCardSelect.value === "" || !selectedOption) {
        alert('순서를 변경할 카드를 선택해주세요.');
        return;
    }

    const selectedId = parseInt(loadCardSelect.value);
    
    let cards = JSON.parse(localStorage.getItem('savedCards')) || [];
    
    // 순서 변경 시에도 ID 기준으로 카드를 찾습니다.
    const index = cards.findIndex(card => card.id === selectedId);

    if (index === -1) return; // 카드를 찾을 수 없음

    // UI상 "위로" 버튼은 배열에서는 "아래"로, "아래로" 버튼은 배열에서 "위"로 이동합니다.
    const moveDirection = (direction === 'up') ? 1 : -1;
    const newActualIndex = index + moveDirection;

    if (newActualIndex >= 0 && newActualIndex < cards.length) {
        // 배열 내 요소의 위치를 맞바꿉니다.
        [cards[index], cards[newActualIndex]] = [cards[newActualIndex], cards[index]];
        
        // Local Storage에 순서가 바뀐 배열을 저장합니다.
        localStorage.setItem('savedCards', JSON.stringify(cards));
        
        // UI를 업데이트하고, 방금 순서를 바꾼 카드를 다시 선택합니다.
        updateCardListUI(searchCardInput.value); // 검색 상태를 유지하며 UI 업데이트
        
        // 변경된 위치의 옵션을 다시 선택하도록 처리
        loadCardSelect.value = selectedId;
    }
}

// === [추가 기능] 카드 목록 파일 관리 (JSON '페이지' 기능) ===

// 전체 카드 목록을 JSON 파일로 다운로드하는 함수
function exportCardList() {
    const cards = JSON.parse(localStorage.getItem('savedCards')) || [];
    
    if (cards.length === 0) {
        alert('저장된 카드가 없습니다. 먼저 카드를 저장해주세요.');
        return;
    }
    
    // 👇 수정: 목록 이름 가져오기 및 파일 이름 설정
    const listName = listNameInput.value.trim();
    // 파일 이름에 사용할 수 없는 문자를 '_'로 대체
    const namePrefix = listName ? listName.replace(/[^a-zA-Z0-9가-힣_-]/g, '_') + '_' : 'Cards_Backup_';
    // 👆 수정 끝
    
    // 1. JSON 파일로 다운로드 준비
    const dataStr = JSON.stringify(cards, null, 2); 
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    const now = new Date();
    const formattedDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    
    // 👇 수정: 목록 이름을 포함한 파일 이름 설정
    link.download = `${namePrefix}${formattedDate}.json`;
    // 👆 수정 끝
    
    // 2. 파일 다운로드 실행
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    // 3. 👇👇👇 [추가] 다운로드 후 Local Storage 비우기 (핵심) 👇👇👇
    if (confirm(`✅ ${cards.length}개의 카드 목록 다운로드가 완료되었습니다. Local Storage의 카드 목록을 비우고 새 페이지로 전환하시겠습니까?`)) {
        localStorage.removeItem('savedCards'); // 목록 삭제
        updateCardListUI(); // 목록 UI 초기화
        alert('Local Storage의 카드 목록이 초기화되었습니다. 이제 새로운 카드를 60개까지 저장할 수 있습니다.');
    } else {
        alert('Local Storage의 카드 목록을 그대로 유지합니다.');
    }
    // 👆👆👆 [추가] 다운로드 후 Local Storage 비우기 (핵심) 👆👆👆
}

// JSON 파일을 업로드하여 목록을 불러오는 함수 (수동 '페이지' 불러오기)
function importCardList(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm('현재 Local Storage에 저장된 카드 목록이 모두 이 파일의 내용으로 대체됩니다. 즉, 페이지가 전환됩니다. 계속하시겠습니까?')) {
        event.target.value = null; 
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedCards = JSON.parse(e.target.result);
            
            if (!Array.isArray(importedCards)) {
                alert('불러온 파일이 유효한 카드 목록 형식이 아닙니다. 배열 형태인지 확인해주세요.');
                event.target.value = null;
                return;
            }

            // Local Storage에 새로운 목록 저장 (페이지 전환)
            localStorage.setItem('savedCards', JSON.stringify(importedCards));
            updateCardListUI(); // UI 업데이트
            
            // 파일 이름에서 확장자를 제거하고 목록 이름 입력 필드에 채웁니다.
            const fileName = file.name.replace(/\.json$/i, '');
            listNameInput.value = fileName; 
            
            alert(`JSON 파일에서 ${importedCards.length}개의 카드 목록을 불러와 '현재 페이지'로 설정했습니다.`);
            
        } catch (error) {
            alert('JSON 파일을 불러오거나 파싱하는 데 실패했습니다. 파일 형식을 확인해주세요.');
            console.error(error);
        } finally {
            event.target.value = null; // 파일 입력값 초기화
        }
    };
    reader.readAsText(file);
}

// === 이벤트 리스너 설정 ===
cardTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        const isMonster = e.target.value === 'monster';
        
        monsterSpecificOptionsDiv.style.display = isMonster ? 'flex' : 'none';
        
        if (!isMonster) {
            currentMonsterFrameSrc = ''; // 유닛이 아닐 땐 몬스터 프레임 소스 초기화
            drawCard(); // 유닛이 아니더라도 프레임이 바뀌므로 캔버스 다시 그림
        } else {
            // 유닛일 경우, 몬스터 타입에 맞는 프레임을 로드하고 (로드가 완료되면 drawCard가 자동 호출됨)
            updateMonsterFrame(monsterTypeSelect.value); 
        }
    });
});

// 기존의 monsterTypeSelect 리스너는 유닛 타입 내부 변경 시 프레임 업데이트를 보장합니다.
monsterTypeSelect.addEventListener('change', (e) => {
    updateMonsterFrame(e.target.value);
});

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            userImageBase64 = event.target.result;
            userImage = new Image();
            userImage.onload = drawCard;
            userImage.src = userImageBase64;
        };
        reader.readAsDataURL(file);
    }
});

// ⭐ 다운로드 직전에 drawCard()를 호출하여 최신 상태를 반영하도록 수정
downloadBtn.addEventListener('click', () => {
    // 다운로드 전에 캔버스에 최신 상태를 그립니다. (이미지 로드 완료 상태라면 바로 그려집니다)
    drawCard(); 
    
    const link = document.createElement('a');
    link.download = `${nameInput.value || 'custom-card'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
});

saveCardBtn.addEventListener('click', saveCard);

// *** 검색 입력창에 대한 이벤트 리스너 추가 (함수 이름 변경) ***
searchCardInput.addEventListener('input', (e) => {
    updateCardListUI(e.target.value); // 함수 이름 변경
});

loadCardSelect.addEventListener('change', (e) => {
    const selectedId = e.target.value;
    if (selectedId !== "") {
        displayCard(selectedId);
    }
});

deleteCardBtn.addEventListener('click', deleteCard);

// 순서 조정 버튼 이벤트 리스너 추가
moveUpBtn.addEventListener('click', (e) => {
    e.preventDefault(); // 버튼의 기본 동작 방지
    moveCard('up');
});

moveDownBtn.addEventListener('click', (e) => {
    e.preventDefault(); // 버튼의 기본 동작 방지
    moveCard('down');
});

// JSON 파일 관리 이벤트 리스너 연결
exportListBtn.addEventListener('click', exportCardList);
importListInput.addEventListener('change', importCardList);

// 상단 효과 입력 필드 리스너 추가
[hpInput, nameInput, descriptionInput, topDescriptionInput].forEach(input => {
    input.addEventListener('input', drawCard);
});

attributeSelect.addEventListener('input', () => {
    updateAttiImage(attributeSelect.value);
});

const baseImages = [attiImg, atkadkImg, hpImg, spellFrameImg, itemFrameImg, buildFrameImg];
const allBaseImagePromises = baseImages.map(img => {
    return new Promise((resolve, reject) => {
        if (img.complete) resolve(img);
        else {
            img.onload = () => resolve(img);
            img.onerror = reject;
        }
    });
});

Promise.all(allBaseImagePromises)
    .then(() => {
        console.log('기본 이미지가 성공적으로 로드되었습니다.');
        updateAttiImage(attributeSelect.value);
        const initialCardType = document.querySelector('input[name="card-type"]:checked').value;
        if (initialCardType === 'monster') {
            monsterSpecificOptionsDiv.style.display = 'flex';
            updateMonsterFrame(monsterTypeSelect.value);
        } else {
            monsterSpecificOptionsDiv.style.display = 'none';
            drawCard();
        }
        updateCardListUI(); // 페이지 로드 시 전체 카드 목록 불러오기 (함수 이름 변경)
    })
    .catch(error => {
        console.error('이미지 로드 중 오류 발생:', error);
    });