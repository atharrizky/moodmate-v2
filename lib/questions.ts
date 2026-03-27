export const moodPrompts: Record<string, { id: string, title: string, prompt: string }[]> = {
  joy: [
    { id: "j1", title: "Momen Bahagia", prompt: '"Momen apa yang paling membuatmu merasa senang atau bersyukur hari ini?"' },
    { id: "j2", title: "Pencapaian", prompt: '"Pencapaian apa, sekecil apapun, yang membuatmu merasa bangga dan puas hari ini?"' },
    { id: "j3", title: "Energi Positif", prompt: '"Siapa atau apa yang memberikan energi positif tambahan untukmu hari ini?"' },
    { id: "j4", title: "Mempertahankan Rasa", prompt: '"Bagaimana caramu untuk membawa perasaan menyenangkan ini ke esok hari?"' }
  ],
  trust: [
    { id: "t1", title: "Rasa Aman", prompt: '"Siapa atau peristiwa apa yang membuatmu merasa aman, nyaman, dan percaya hari ini?"' },
    { id: "t2", title: "Dukungan", prompt: '"Adakah seseorang yang sangat membantumu atau bisa kamu andalkan hari ini? Ceritakan."' },
    { id: "t3", title: "Kepercayaan Diri", prompt: '"Dalam hal apa kamu merasa sangat percaya pada kemampuan dirimu sendiri hari ini?"' },
    { id: "t4", title: "Membangun Ikatan", prompt: '"Apa yang bisa kamu lakukan untuk semakin memperkuat rasa percaya dengan orang di sekitarmu?"' }
  ],
  fear: [
    { id: "f1", title: "Akar Kecemasan", prompt: '"Hal apa yang paling membuatmu merasa cemas, khawatir, atau takut hari ini?"' },
    { id: "f2", title: "Area Kendali", prompt: '"Apakah ketakutan ini berasal dari sesuatu yang bisa kamu kendalikan atau di luar kendalimu?"' },
    { id: "f3", title: "Skenario Terburuk", prompt: '"Jika hal yang kamu takuti benar-benar terjadi, apa langkah pertamamu untuk menghadapinya?"' },
    { id: "f4", title: "Penenang Diri", prompt: '"Apa satu hal kecil yang bisa kamu lakukan sekarang untuk membuat dirimu merasa lebih aman dan tenang?"' }
  ],
  surprise: [
    { id: "sr1", title: "Kejadian Tak Terduga", prompt: '"Apakah ada kejadian di luar dugaan yang terjadi hari ini? Jelaskan."' },
    { id: "sr2", title: "Respons Diri", prompt: '"Bagaimana reaksimu terhadap hal tersebut, dan adakah pelajaran yang bisa diambil?"' },
    { id: "sr3", title: "Perubahan Rencana", prompt: '"Bagaimana kejutan hari ini mengubah rencanamu, dan adakah sisi positifnya?"' },
    { id: "sr4", title: "Penemuan Baru", prompt: '"Hal baru apa yang kamu pelajari tentang dirimu atau sekitarmu dari kejadian mengejutkan ini?"' }
  ],
  sad: [
    { id: "sd1", title: "Validasi Perasaan", prompt: '"Apa yang sedang membebani pikiranmu atau membuatmu bersedih hari ini? Ceritakanlah pelan-pelan."' },
    { id: "sd2", title: "Kebutuhan Diri", prompt: '"Apa yang paling kamu butuhkan saat ini untuk bisa merasa sedikit lebih lega?"' },
    { id: "sd3", title: "Kebaikan Hati", prompt: '"Bagaimana caramu berbuat baik dan lembut pada dirimu sendiri di tengah perasaan sedih ini?"' },
    { id: "sd4", title: "Titik Terang", prompt: '"Meskipun hari ini terasa berat, adakah satu hal kecil yang masih bisa kamu syukuri?"' }
  ],
  disgust: [
    { id: "dg1", title: "Prinsip Pribadi", prompt: '"Apakah ada hal atau situasi hari ini yang terasa sangat bertentangan dengan prinsip dan nilaimu?"' },
    { id: "dg2", title: "Evaluasi Ketidaknyamanan", prompt: '"Mengapa hal tersebut membuatmu sangat tidak nyaman? Nilai apa yang sedang kamu lindungi?"' },
    { id: "dg3", title: "Batasan (Boundaries)", prompt: '"Batasan apa yang perlu kamu tegaskan atau perkuat setelah kejadian hari ini?"' },
    { id: "dg4", title: "Langkah Menjauh", prompt: '"Apa yang bisa kamu lakukan untuk menjaga integritas dan jarak dari hal yang membawa pengaruh buruk tersebut?"' }
  ],
  anger: [
    { id: "ag1", title: "Pemicu Amarah", prompt: '"Situasi atau kejadian apa yang memicu rasa frustrasi atau amarahmu hari ini?"' },
    { id: "ag2", title: "Akar Emosi", prompt: '"Apakah di balik amarah ini sebenarnya ada rasa kecewa, tidak dihargai, atau terluka? Jelaskan."' },
    { id: "ag3", title: "Penyaluran Emosi", prompt: '"Apa yang kamu lakukan untuk menyalurkan amarah ini dengan cara yang aman dan tidak merusak?"' },
    { id: "ag4", title: "Respon Alternatif", prompt: '"Jika kamu bisa memutar waktu dengan pikiran yang lebih tenang, bagaimana kamu akan merespons situasi tadi?"' }
  ],
  anticipation: [
    { id: "an1", title: "Visi Masa Depan", prompt: '"Hal apa yang paling kamu tunggu-tunggu atau persiapkan dengan antusias untuk esok hari?"' },
    { id: "an2", title: "Langkah Persiapan", prompt: '"Apa satu langkah kecil yang bisa kamu lakukan besok untuk semakin dekat dengan tujuanmu?"' },
    { id: "an3", title: "Harapan vs Kekhawatiran", prompt: '"Apa harapan terbesarmu dan kekhawatiran utamamu tentang hal yang sedang kamu tunggu ini?"' },
    { id: "an4", title: "Fokus Saat Ini", prompt: '"Bagaimana caramu tetap bisa menikmati momen hari ini sambil menantikan hari esok?"' }
  ],
  default: [
    { id: "df1", title: "Ruang Bebas", prompt: '"Tuliskan dengan bebas apa yang sedang kamu rasakan dan pikirkan saat ini."' },
    { id: "df2", title: "Mengurai Pikiran", prompt: '"Apa hal utama yang menyita perhatian atau pikiranmu sepanjang hari ini?"' },
    { id: "df3", title: "Dialog Internal", prompt: '"Jika kamu bisa memberikan satu nasihat bijak untuk dirimu sendiri hari ini, apa itu?"' },
    { id: "df4", title: "Penutup", prompt: '"Apakah ada hal lain yang belum terungkap dan ingin kamu lepaskan ke dalam tulisan?"' }
  ]
}