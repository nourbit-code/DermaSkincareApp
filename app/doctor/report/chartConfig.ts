// app/doctor/report/chartConfig.ts
export const chartConfig = {
  backgroundGradientFrom: "#FFFFFF",
  backgroundGradientTo: "#FFFFFF",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(155,8,77, ${opacity})`, // primary purple
  labelColor: (opacity = 1) => `rgba(68,68,68, ${opacity})`,
  propsForDots: { r: "4", strokeWidth: "2", stroke: "#fff" },
  style: { borderRadius: 16 },
};
