// Переконайтеся, що GSAP підключено у вашому HTML, наприклад:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
// Додайте це в <head> вашого HTML, якщо ще не додано.

// Оновлені селектори, які відповідають вашому HTML
const usernameInput = document.querySelector('#username');
const passwordInput = document.querySelector('#password');
const mySVG = document.querySelector('.svgContainer');
const armL = document.querySelector('.armL');
const armR = document.querySelector('.armR');
const eyeL = document.querySelector('.eyeL');
const eyeR = document.querySelector('.eyeR');
const nose = document.querySelector('.nose');
const mouth = document.querySelector('.mouth');
const mouthBG = document.querySelector('.mouthBG');
const mouthSmallBG = document.querySelector('.mouthSmallBG');
const mouthMediumBG = document.querySelector('.mouthMediumBG');
const mouthLargeBG = document.querySelector('.mouthLargeBG');
const mouthMaskPath = document.querySelector('#mouthMaskPath');
const mouthOutline = document.querySelector('.mouthOutline');
const tooth = document.querySelector('.tooth');
const tongue = document.querySelector('.tongue');
const chin = document.querySelector('.chin');
const face = document.querySelector('.face');
const eyebrow = document.querySelector('.eyebrow');
const outerEarL = document.querySelector('.earL .outerEar');
const outerEarR = document.querySelector('.earR .outerEar');
const earHairL = document.querySelector('.earL .earHair');
const earHairR = document.querySelector('.earR .earHair');
const hair = document.querySelector('.hair');

let caretPos, curUsernameIndex, screenCenter, svgCoords, eyeMaxHorizD = 20, eyeMaxVertD = 10, noseMaxHorizD = 23, noseMaxVertD = 10, mouthStatus = "small";

function getCoord(e) {
    const carPos = usernameInput.selectionEnd;
    const div = document.createElement('div');
    const span = document.createElement('span');
    const copyStyle = getComputedStyle(usernameInput);

    // Копіюємо стилі для точного позиціонування
    for (const prop of copyStyle) {
        div.style[prop] = copyStyle[prop];
    }
    div.style.position = 'absolute';
    document.body.appendChild(div);
    div.textContent = usernameInput.value.substr(0, carPos);
    span.textContent = usernameInput.value.substr(carPos) || '.';
    div.appendChild(span);

    const usernameCoords = getPosition(usernameInput);
    const caretCoords = getPosition(span);
    const centerCoords = getPosition(mySVG);
    svgCoords = getPosition(mySVG);
    screenCenter = centerCoords.x + (mySVG.offsetWidth / 2);
    caretPos = caretCoords.x + usernameCoords.x;

    const dFromC = screenCenter - caretPos;
    let pFromC = Math.round((caretPos / screenCenter) * 100) / 100;
    if (pFromC > 1) {
        pFromC -= 2;
        pFromC = Math.abs(pFromC);
    }

    let eyeDistH = -dFromC * 0.05;
    if (eyeDistH > eyeMaxHorizD) {
        eyeDistH = eyeMaxHorizD;
    } else if (eyeDistH < -eyeMaxHorizD) {
        eyeDistH = -eyeMaxHorizD;
    }

    const eyeLCoords = { x: svgCoords.x + 84, y: svgCoords.y + 76 };
    const eyeRCoords = { x: svgCoords.x + 113, y: svgCoords.y + 76 };
    const noseCoords = { x: svgCoords.x + 97, y: svgCoords.y + 81 };
    const mouthCoords = { x: svgCoords.x + 100, y: svgCoords.y + 100 };

    const eyeLAngle = getAngle(eyeLCoords.x, eyeLCoords.y, usernameCoords.x + caretCoords.x, usernameCoords.y + 25);
    const eyeLX = Math.cos(eyeLAngle) * eyeMaxHorizD;
    const eyeLY = Math.sin(eyeLAngle) * eyeMaxVertD;
    const eyeRAngle = getAngle(eyeRCoords.x, eyeRCoords.y, usernameCoords.x + caretCoords.x, usernameCoords.y + 25);
    const eyeRX = Math.cos(eyeRAngle) * eyeMaxHorizD;
    const eyeRY = Math.sin(eyeRAngle) * eyeMaxVertD;
    const noseAngle = getAngle(noseCoords.x, noseCoords.y, usernameCoords.x + caretCoords.x, usernameCoords.y + 25);
    const noseX = Math.cos(noseAngle) * noseMaxHorizD;
    const noseY = Math.sin(noseAngle) * noseMaxVertD;
    const mouthAngle = getAngle(mouthCoords.x, mouthCoords.y, usernameCoords.x + caretCoords.x, usernameCoords.y + 25);
    const mouthX = Math.cos(mouthAngle) * noseMaxHorizD;
    const mouthY = Math.sin(mouthAngle) * noseMaxVertD;
    const mouthR = Math.cos(mouthAngle) * 6;
    const chinX = mouthX * 0.8;
    const chinY = mouthY * 0.5;
    let chinS = 1 - ((dFromC * 0.15) / 100);
    if (chinS > 1) { chinS = 1 - (chinS - 1); }
    const faceX = mouthX * 0.3;
    const faceY = mouthY * 0.4;
    const faceSkew = Math.cos(mouthAngle) * 5;
    const eyebrowSkew = Math.cos(mouthAngle) * 25;
    const outerEarX = Math.cos(mouthAngle) * 4;
    const outerEarY = Math.cos(mouthAngle) * 5;
    const hairX = Math.cos(mouthAngle) * 6;
    const hairS = 1.2;

    gsap.to(eyeL, { x: -eyeLX, y: -eyeLY, ease: 'expo.out', duration: 1 });
    gsap.to(eyeR, { x: -eyeRX, y: -eyeRY, ease: 'expo.out', duration: 1 });
    gsap.to(nose, { x: -noseX, y: -noseY, rotation: mouthR, transformOrigin: "center center", ease: 'expo.out', duration: 1 });
    gsap.to(mouth, { x: -mouthX, y: -mouthY, rotation: mouthR, transformOrigin: "center center", ease: 'expo.out', duration: 1 });
    gsap.to(chin, { x: -chinX, y: -chinY, scaleY: chinS, ease: 'expo.out', duration: 1 });
    gsap.to(face, { x: -faceX, y: -faceY, skewX: -faceSkew, transformOrigin: "center top", ease: 'expo.out', duration: 1 });
    gsap.to(eyebrow, { x: -faceX, y: -faceY, skewX: -eyebrowSkew, transformOrigin: "center top", ease: 'expo.out', duration: 1 });
    gsap.to(outerEarL, { x: outerEarX, y: -outerEarY, ease: 'expo.out', duration: 1 });
    gsap.to(outerEarR, { x: outerEarX, y: outerEarY, ease: 'expo.out', duration: 1 });
    gsap.to(earHairL, { x: -outerEarX, y: -outerEarY, ease: 'expo.out', duration: 1 });
    gsap.to(earHairR, { x: -outerEarX, y: outerEarY, ease: 'expo.out', duration: 1 });
    gsap.to(hair, { x: hairX, scaleY: hairS, transformOrigin: "center bottom", ease: 'expo.out', duration: 1 });

    document.body.removeChild(div);
}

function onUsernameInput(e) {
    getCoord(e);
    const value = e.target.value;
    curUsernameIndex = value.length;

    // Логіка для зміни виразу обличчя залежно від введення
    if (curUsernameIndex > 0) {
        if (mouthStatus === "small") {
            mouthStatus = "medium";
            gsap.to([mouthBG, mouthOutline, mouthMaskPath], { morphSVG: mouthMediumBG, shapeIndex: 8, ease: 'expo.out', duration: 1 });
            gsap.to(tooth, { x: 0, y: 0, ease: 'expo.out', duration: 1 });
            gsap.to(tongue, { x: 0, y: 1, ease: 'expo.out', duration: 1 });
            gsap.to([eyeL, eyeR], { scaleX: 0.85, scaleY: 0.85, ease: 'expo.out', duration: 1 });
        }
        if (value.includes("@")) {
            mouthStatus = "large";
            gsap.to([mouthBG, mouthOutline, mouthMaskPath], { morphSVG: mouthLargeBG, ease: 'expo.out', duration: 1 });
            gsap.to(tooth, { x: 3, y: -2, ease: 'expo.out', duration: 1 });
            gsap.to(tongue, { y: 2, ease: 'expo.out', duration: 1 });
            gsap.to([eyeL, eyeR], { scaleX: 0.65, scaleY: 0.65, ease: 'expo.out', transformOrigin: "center center", duration: 1 });
        } else {
            mouthStatus = "medium";
            gsap.to([mouthBG, mouthOutline, mouthMaskPath], { morphSVG: mouthMediumBG, ease: 'expo.out', duration: 1 });
            gsap.to(tooth, { x: 0, y: 0, ease: 'expo.out', duration: 1 });
            gsap.to(tongue, { x: 0, y: 1, ease: 'expo.out', duration: 1 });
            gsap.to([eyeL, eyeR], { scaleX: 0.85, scaleY: 0.85, ease: 'expo.out', duration: 1 });
        }
    } else {
        mouthStatus = "small";
        gsap.to([mouthBG, mouthOutline, mouthMaskPath], { morphSVG: mouthSmallBG, shapeIndex: 9, ease: 'expo.out', duration: 1 });
        gsap.to(tooth, { x: 0, y: 0, ease: 'expo.out', duration: 1 });
        gsap.to(tongue, { y: 0, ease: 'expo.out', duration: 1 });
        gsap.to([eyeL, eyeR], { scaleX: 1, scaleY: 1, ease: 'expo.out', duration: 1 });
    }
}

function onUsernameFocus() {
    getCoord({ target: usernameInput });
}

function onUsernameBlur() {
    resetFace();
}

function onPasswordFocus() {
    coverEyes();
}

function onPasswordBlur() {
    uncoverEyes();
}

function coverEyes() {
    gsap.to(armL, { x: -93, y: 2, rotation: 0, ease: 'power2.out', duration: 0.45 });
    gsap.to(armR, { x: -93, y: 2, rotation: 0, ease: 'power2.out', duration: 0.45, delay: 0.1 });
}

function uncoverEyes() {
    gsap.to(armL, { y: 220, rotation: 105, ease: 'power2.out', duration: 1.35 });
    gsap.to(armR, { y: 220, rotation: -105, ease: 'power2.out', duration: 1.35, delay: 0.1 });
}

function resetFace() {
    gsap.to([eyeL, eyeR], { x: 0, y: 0, scaleX: 1, scaleY: 1, ease: 'expo.out', duration: 1 });
    gsap.to(nose, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, ease: 'expo.out', duration: 1 });
    gsap.to(mouth, { x: 0, y: 0, rotation: 0, ease: 'expo.out', duration: 1 });
    gsap.to(chin, { x: 0, y: 0, scaleY: 1, ease: 'expo.out', duration: 1 });
    gsap.to([face, eyebrow], { x: 0, y: 0, skewX: 0, ease: 'expo.out', duration: 1 });
    gsap.to([outerEarL, outerEarR, earHairL, earHairR, hair], { x: 0, y: 0, scaleY: 1, ease: 'expo.out', duration: 1 });
}

function getAngle(x1, y1, x2, y2) {
    return Math.atan2(y1 - y2, x1 - x2);
}

function getPosition(el) {
    let xPos = 0, yPos = 0;
    while (el) {
        if (el.tagName === "BODY") {
            const xScroll = el.scrollLeft || document.documentElement.scrollLeft;
            const yScroll = el.scrollTop || document.documentElement.scrollTop;
            xPos += (el.offsetLeft - xScroll + el.clientLeft);
            yPos += (el.offsetTop - yScroll + el.clientTop);
        } else {
            xPos += (el.offsetLeft - el.scrollLeft + el.clientLeft);
            yPos += (el.offsetTop - el.scrollTop + el.clientTop);
        }
        el = el.offsetParent;
    }
    return { x: xPos, y: yPos };
}

// Додаємо обробники подій
usernameInput.addEventListener('focus', onUsernameFocus);
usernameInput.addEventListener('blur', onUsernameBlur);
usernameInput.addEventListener('input', onUsernameInput);
passwordInput.addEventListener('focus', onPasswordFocus);
passwordInput.addEventListener('blur', onPasswordBlur);

// Ініціалізація позицій рук
gsap.set(armL, { x: -93, y: 220, rotation: 105, transformOrigin: "top left" });
gsap.set(armR, { x: -93, y: 220, rotation: -105, transformOrigin: "top right" });