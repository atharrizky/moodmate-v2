export function getActiveUserEmail() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("moodmate_active_user");
}

export function getUser() {
  const email = getActiveUserEmail();
  if (!email) return null;
  
  const data = localStorage.getItem(`moodmate_data_${email}`);
  
  if (data) {
    const user = JSON.parse(data);
    
    // LOGIKA LEVELING (Otomatis menghitung level saat data dipanggil)
    // Rumus: Setiap 5 jurnal, naik 1 level.
    user.level = Math.floor(user.entries.length / 5) + 1;
    
    return user;
  }
  
  return null;
}

export function saveUser(user: any) {
  localStorage.setItem(`moodmate_data_${user.email}`, JSON.stringify(user));
}

export function loginUser(name: string) {
  const email = `${name.toLowerCase().replace(/\s/g, '')}@mail.com`;
  
  // Set user ini sebagai user yang sedang aktif
  localStorage.setItem("moodmate_active_user", email);
  
  // Cek apakah user ini sudah pernah daftar sebelumnya
  const existingUser = localStorage.getItem(`moodmate_data_${email}`);
  if (!existingUser) {
    // Jika belum, buatkan database baru untuknya
    const newUser = {
      name: name,
      email: email,
      points: 0,
      level: 1, // Akan otomatis terkoreksi oleh getUser()
      pets: [],
      activePet: "",
      entries: [],
      streak: 0,
      lastEntry: null
    };
    saveUser(newUser);
  }
}

export function logoutUser() {
  // Hanya hapus sesi aktifnya, JANGAN hapus datanya
  localStorage.removeItem("moodmate_active_user");
}

export function addJournal(entry: any) {
  const user = getUser();
  if (!user) return;

  user.entries.push(entry);
  
  // Berikan 10 koin setiap kali selesai menulis jurnal
  user.points += 10;

  // Update level secara real-time saat menyimpan
  user.level = Math.floor(user.entries.length / 5) + 1;

  updateStreak(user);
  saveUser(user);
}

function updateStreak(user: any) {
  const today = new Date().toDateString();
  if (user.lastEntry === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (user.lastEntry === yesterday.toDateString()) {
    user.streak += 1;
  } else {
    user.streak = 1;
  }
  user.lastEntry = today;
}