import { auth, signInWithEmailAndPassword, onAuthStateChanged } from './auth.js';

const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const btnText = loginBtn.querySelector('.btn-text');
const spinner = loginBtn.querySelector('.spinner');
const errorMessage = document.getElementById('error-message');

// 이미 로그인된 상태라면 index.html로 이동
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.replace('index.html');
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) return;

  // UI 업데이트 (로딩 상태)
  loginBtn.disabled = true;
  btnText.classList.add('hidden');
  spinner.classList.remove('hidden');
  errorMessage.classList.add('hidden');

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // 로그인 성공 시 onAuthStateChanged가 감지하여 리다이렉트 처리함
  } catch (error) {
    console.error("Login failed:", error);
    errorMessage.classList.remove('hidden');
    
    // 에러 메시지 세분화
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      errorMessage.textContent = '아이디 또는 비밀번호가 올바르지 않습니다. (공백이 복사되지 않았는지 확인해주세요!)';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage.textContent = '너무 많은 시도로 인해 잠시 차단되었습니다. 나중에 다시 시도해주세요.';
    } else {
      errorMessage.textContent = '로그인 오류: ' + error.code + ' (' + error.message + ')';
    }

    loginBtn.disabled = false;
    btnText.classList.remove('hidden');
    spinner.classList.add('hidden');
  }
});
