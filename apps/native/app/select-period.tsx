import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MONTHS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const MONTH_FULL = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

type DotVariant = "income" | "expense";

const MONTH_DOTS: Record<number, DotVariant[]> = {
  0: ["income"],
  1: ["expense", "income"],
};

const CURRENT_MONTH = 2;

const getDotColor = (isSelected: boolean, variant: DotVariant): string => {
  if (isSelected) {
    return "#FFFFFF";
  }
  return variant === "income" ? "#10B981" : "#EF4444";
};

const SelectPeriodScreen = () => {
  const insets = useSafeAreaInsets();
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);

  return (
    <View
      style={{ flex: 1, backgroundColor: "#0B1420", paddingTop: insets.top }}
    >
      <View
        className="flex-row items-center justify-between px-6"
        style={{ paddingTop: 8, paddingBottom: 20 }}
      >
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full active:opacity-60"
          onPress={() => router.back()}
          style={{ backgroundColor: "#131C28" }}
        >
          <Ionicons color="#C2C6D6" name="close" size={22} />
        </Pressable>
        <Text style={{ color: "#F1F5F9", fontSize: 18, fontWeight: "700" }}>
          Select Period
        </Text>
        <View
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: "#131C28" }}
        >
          <Ionicons color="#ADC6FF" name="calendar" size={20} />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center" style={{ marginBottom: 28 }}>
          <Text
            style={{
              color: "#C2C6D6",
              fontSize: 10,
              fontWeight: "700",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Active Year
          </Text>
          <View className="flex-row items-center" style={{ gap: 20 }}>
            <Pressable
              className="items-center justify-center rounded-xl active:opacity-60"
              onPress={() => setSelectedYear(selectedYear - 1)}
              style={{ width: 44, height: 44, backgroundColor: "#131C28" }}
            >
              <Ionicons color="#C2C6D6" name="chevron-back" size={22} />
            </Pressable>
            <Text style={{ color: "#F1F5F9", fontSize: 36, fontWeight: "700" }}>
              {selectedYear}
            </Text>
            <Pressable
              className="items-center justify-center rounded-xl active:opacity-60"
              onPress={() => setSelectedYear(selectedYear + 1)}
              style={{ width: 44, height: 44, backgroundColor: "#131C28" }}
            >
              <Ionicons color="#C2C6D6" name="chevron-forward" size={22} />
            </Pressable>
          </View>
        </View>

        <View
          className="flex-row flex-wrap"
          style={{ gap: 10, marginBottom: 28 }}
        >
          {MONTHS.map((month, index) => {
            const isSelected = selectedMonth === index;
            const dots = MONTH_DOTS[index];

            return (
              <Pressable
                className="items-center justify-center rounded-xl active:opacity-80"
                key={month}
                onPress={() => setSelectedMonth(index)}
                style={{
                  width: "31%",
                  height: 88,
                  backgroundColor: isSelected ? "#3B82F6" : "#222A37",
                  padding: 16,
                }}
              >
                {dots ? (
                  <View
                    className="absolute flex-row"
                    style={{ top: 10, right: 10, gap: 4 }}
                  >
                    {dots.map((variant) => (
                      <View
                        className="rounded-full"
                        key={variant}
                        style={{
                          width: 7,
                          height: 7,
                          backgroundColor: getDotColor(isSelected, variant),
                        }}
                      />
                    ))}
                  </View>
                ) : null}

                {isSelected ? (
                  <View
                    className="absolute rounded-full"
                    style={{
                      top: 10,
                      right: 10,
                      width: 7,
                      height: 7,
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                ) : null}

                <Text
                  style={{
                    color: isSelected ? "#FFFFFF" : "#C2C6D6",
                    fontSize: 16,
                    fontWeight: isSelected ? "700" : "500",
                  }}
                >
                  {month}
                </Text>

                {isSelected ? (
                  <View
                    className="absolute rounded-full"
                    style={{
                      bottom: 12,
                      width: 24,
                      height: 3,
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View
          className="rounded-2xl"
          style={{ backgroundColor: "#222A37", padding: 24 }}
        >
          <View
            className="flex-row items-center justify-between"
            style={{ marginBottom: 2 }}
          >
            <Text style={{ color: "#F1F5F9", fontSize: 22, fontWeight: "700" }}>
              {MONTH_FULL[selectedMonth]} {selectedYear}
            </Text>
          </View>
          <Text
            style={{
              color: "#94A3B8",
              fontSize: 10,
              fontWeight: "700",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Summary Status
          </Text>

          <View
            className="flex-row items-center self-start rounded-full"
            style={{
              backgroundColor: "#222A37",
              borderWidth: 1,
              borderColor: "#424754",
              paddingHorizontal: 14,
              paddingVertical: 8,
              gap: 8,
              marginBottom: 20,
            }}
          >
            <View
              className="rounded-full"
              style={{ width: 8, height: 8, backgroundColor: "#10B981" }}
            />
            <Text style={{ color: "#C2C6D6", fontSize: 12, fontWeight: "600" }}>
              Active View
            </Text>
          </View>

          <View className="flex-row" style={{ gap: 16, marginBottom: 28 }}>
            <View
              className="flex-1 rounded-2xl"
              style={{ backgroundColor: "#17202D", padding: 16 }}
            >
              <Text style={{ color: "#94A3B8", fontSize: 12, marginBottom: 6 }}>
                Total Income
              </Text>
              <Text
                style={{
                  color: "#10B981",
                  fontSize: 18,
                  fontWeight: "700",
                  fontFamily: "monospace",
                }}
              >
                +$12,450.00
              </Text>
            </View>
            <View
              className="flex-1 rounded-2xl"
              style={{ backgroundColor: "#17202D", padding: 16 }}
            >
              <Text style={{ color: "#94A3B8", fontSize: 12, marginBottom: 6 }}>
                Expenses
              </Text>
              <Text
                style={{
                  color: "#EF4444",
                  fontSize: 18,
                  fontWeight: "700",
                  fontFamily: "monospace",
                }}
              >
                -$8,215.30
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View
        className="px-6"
        style={{ paddingBottom: Math.max(insets.bottom, 16), paddingTop: 12 }}
      >
        <Pressable
          className="flex-row items-center justify-center rounded-xl active:opacity-80"
          onPress={() => router.back()}
          style={{ height: 56, backgroundColor: "#ADC6FF", gap: 10 }}
        >
          <Text style={{ color: "#002E6A", fontSize: 16, fontWeight: "700" }}>
            Confirm Selection
          </Text>
          <Ionicons color="#002E6A" name="checkmark" size={20} />
        </Pressable>
      </View>
    </View>
  );
};

export default SelectPeriodScreen;
