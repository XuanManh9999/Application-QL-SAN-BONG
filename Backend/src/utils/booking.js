const buildBookingCode = () => {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");

  return `BK${y}${m}${d}${random}`;
};

const isOverlap = (startA, endA, startB, endB) => {
  return startA < endB && endA > startB;
};

module.exports = {
  buildBookingCode,
  isOverlap,
};
