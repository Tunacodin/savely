import { useState } from "react";
import { View, Text, Pressable, Modal, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { useThemeColors } from "@/hooks/use-theme";
import { requestOverlayPermission, requestAccessibilityPermission } from "@/modules/floating-bubble";

const STEPS = [
  {
    icon: "notification-line",
    iconColor: "#6366f1",
    title: "Bildirimler",
    description: "Kaydetme işlemleri ve güncellemeler için bildirim göndereceğiz.",
    action: "İzin Ver",
    skip: true,
  },
  {
    icon: "bubble-line",
    iconColor: "#f59e0b",
    title: "Ekran Üstü İzni",
    description: "Floating bubble'ın diğer uygulamaların üzerinde görünmesi için gerekli. Ayarlara yönlendirileceksiniz.",
    action: "Ayarlara Git",
    skip: true,
  },
  {
    icon: "eye-line",
    iconColor: "#10b981",
    title: "Erişilebilirlik Servisi",
    description: "Savely, siz floating bubble'ı bir içeriğin üzerine bıraktığınızda o ekrandaki URL ve başlık bilgisini okur. Bu veri yalnızca ilgili içeriği koleksiyonunuza kaydetmek için kullanılır. Hiçbir kişisel veri toplanmaz veya üçüncü taraflarla paylaşılmaz.",
    action: "Ayarlara Git",
    skip: true,
  },
];

interface Props {
  visible: boolean;
  onDone: () => void;
}

export function PermissionSetupModal({ visible, onDone }: Props) {
  const c = useThemeColors();
  const [step, setStep] = useState(0);

  if (Platform.OS !== "android") return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleAction = async () => {
    if (step === 1) await requestOverlayPermission();
    if (step === 2) await requestAccessibilityPermission();
    if (isLast) { onDone(); return; }
    setStep((s) => s + 1);
  };

  const handleSkip = () => {
    if (isLast) { onDone(); return; }
    setStep((s) => s + 1);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
        <SafeAreaView edges={["bottom"]}>
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 20 }}>

            {/* Step indicator */}
            <View style={{ flexDirection: "row", gap: 6, justifyContent: "center" }}>
              {STEPS.map((_, i) => (
                <View
                  key={i}
                  style={{
                    height: 4, borderRadius: 2,
                    width: i === step ? 24 : 8,
                    backgroundColor: i <= step ? c.buttonPrimary : c.divider,
                  }}
                />
              ))}
            </View>

            {/* Icon */}
            <View style={{ alignItems: "center" }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: current.iconColor + "20", alignItems: "center", justifyContent: "center" }}>
                <MingCuteIcon name={current.icon as any} size={36} color={current.iconColor} />
              </View>
            </View>

            {/* Text */}
            <View style={{ gap: 8, alignItems: "center" }}>
              <Text style={{ fontFamily: "Rubik_600SemiBold", fontSize: 20, color: c.textPrimary, textAlign: "center" }}>
                {current.title}
              </Text>
              <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 14, color: c.textSecondary, textAlign: "center", lineHeight: 22 }}>
                {current.description}
              </Text>
            </View>

            {/* Buttons */}
            <View style={{ gap: 10 }}>
              <Pressable
                onPress={handleAction}
                style={{ backgroundColor: c.buttonPrimary, borderRadius: 14, height: 52, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ fontFamily: "Rubik_600SemiBold", fontSize: 15, color: "#fff" }}>
                  {current.action}
                </Text>
              </Pressable>

              <Pressable onPress={handleSkip} style={{ height: 44, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 14, color: c.textTertiary }}>
                  {isLast ? "Tamam" : "Şimdi Değil"}
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
