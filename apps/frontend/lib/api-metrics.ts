// apps/frontend/lib/api-metrics.ts
// Hàm dùng để đo lường hiệu suất API call

export const measureApiCall = async (
  apiName: string,
  apiCallFn: () => Promise<any>
) => {
  const t1_start = performance.now(); // 🕒 Bắt đầu T1

  try {
    const response = await apiCallFn();

    const t1_end = performance.now(); // 🏁 Kết thúc T1
    const t1_total_ms = (t1_end - t1_start).toFixed(2);

    // Lấy T2 từ Header mà Backend gửi về
    // Lưu ý: Tên header trong axios thường viết thường hết
    const t2_server_ms = parseFloat(response.headers['x-server-time'] || '0');

    // Tính độ trễ mạng (Network Latency)
    const network_latency = (parseFloat(t1_total_ms) - t2_server_ms).toFixed(2);

    console.group(`📊 METRICS: ${apiName}`);
    console.log(`1️⃣ Tổng thời gian (T1): ${t1_total_ms} ms`);
    console.log(`2️⃣ Server xử lý (T2):   ${t2_server_ms} ms`);
    console.log(`3️⃣ Độ trễ mạng (Net):   ${network_latency} ms`);

    // KẾT LUẬN TỰ ĐỘNG
    if (parseFloat(network_latency) > 1000) {
      console.warn('👉 CHẬM DO MẠNG (Internet/Wifi)');
    } else if (t2_server_ms > 500) {
      console.warn('👉 CHẬM DO BACKEND (Code/DB)');
    } else {
      console.log('✅ Tốc độ ổn định');
    }
    console.groupEnd();

    return response;
  } catch (error) {
    console.error(`❌ API Error: ${apiName}`, error);
    throw error;
  }
};
