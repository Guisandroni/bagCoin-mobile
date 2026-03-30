import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";

import { Container } from "@/components/container";

type ThemeOption = "light" | "dark" | "auto";

const THEME_OPTIONS: { key: ThemeOption; label: string }[] = [
  { key: "light", label: "Claro" },
  { key: "dark", label: "Escuro" },
  { key: "auto", label: "Auto" },
];

const Divider = () => (
  <View
    style={{
      height: 1,
      marginLeft: 68,
      backgroundColor: "rgba(241,245,249,0.05)",
    }}
  />
);

const SectionTitle = ({ children }: { children: string }) => (
  <Text
    style={{
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 2,
      color: "#94A3B8",
    }}
  >
    {children}
  </Text>
);

const RowIcon = ({
  name,
  color = "#ADC6FF",
  bg = "rgba(173,198,255,0.1)",
}: {
  name: keyof typeof Ionicons.glyphMap;
  color?: string;
  bg?: string;
}) => (
  <View
    style={{
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: bg,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    }}
  >
    <Ionicons color={color} name={name} size={20} />
  </View>
);

const ProfileScreen = () => {
  const [theme, setTheme] = useState<ThemeOption>("dark");
  const [notifications, setNotifications] = useState(true);

  return (
    <Container>
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 16,
          gap: 24,
          paddingBottom: 32,
        }}
      >
        <View
          style={{
            backgroundColor: "#162231",
            borderRadius: 16,
            padding: 24,
            alignItems: "center",
          }}
        >
          <View style={{ marginBottom: 12 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                borderWidth: 2,
                borderColor: "#D4A847",
                backgroundColor: "#17202D",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: "#F1F5F9",
                  fontSize: 32,
                  fontWeight: "700",
                }}
              >
                G
              </Text>
            </View>
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: "#222A37",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: "#162231",
              }}
            >
              <Ionicons color="#ADC6FF" name="camera" size={14} />
            </View>
          </View>

          <Text
            style={{
              fontSize: 22,
              fontWeight: "600",
              color: "#F1F5F9",
              marginBottom: 2,
            }}
          >
            Guilherme Silva
          </Text>
          <Text style={{ fontSize: 14, color: "#94A3B8", marginBottom: 12 }}>
            guilherme@email.com
          </Text>
          <Pressable
            style={{
              borderWidth: 1,
              borderColor: "rgba(173,198,255,0.2)",
              backgroundColor: "rgba(77,142,255,0.1)",
              borderRadius: 999,
              paddingHorizontal: 24,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: "#ADC6FF", fontSize: 13, fontWeight: "500" }}>
              Editar perfil
            </Text>
          </Pressable>
        </View>

        <View style={{ gap: 8 }}>
          <SectionTitle>FINANCEIRO</SectionTitle>
          <View
            style={{
              backgroundColor: "#222A37",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <Pressable
              onPress={() => router.push("/accounts")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
              }}
            >
              <RowIcon name="business-outline" />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#F1F5F9",
                    fontSize: 15,
                    fontWeight: "500",
                  }}
                >
                  Gerenciar Contas e Cartões
                </Text>
                <Text style={{ color: "#94A3B8", fontSize: 12, marginTop: 2 }}>
                  3 contas · 2 cartões
                </Text>
              </View>
              <Ionicons color="#475569" name="chevron-forward" size={18} />
            </Pressable>

            <Divider />

            <Pressable
              onPress={() => router.push("/categories")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
              }}
            >
              <RowIcon name="pricetag-outline" />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#F1F5F9",
                    fontSize: 15,
                    fontWeight: "500",
                  }}
                >
                  Categorias
                </Text>
                <Text style={{ color: "#94A3B8", fontSize: 12, marginTop: 2 }}>
                  Gerenciar categorias personalizadas
                </Text>
              </View>
              <Ionicons color="#475569" name="chevron-forward" size={18} />
            </Pressable>

            <Divider />

            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
              }}
            >
              <RowIcon name="cash-outline" />
              <Text
                style={{
                  flex: 1,
                  color: "#F1F5F9",
                  fontSize: 15,
                  fontWeight: "500",
                }}
              >
                Moeda padrão
              </Text>
              <Text
                style={{
                  color: "#94A3B8",
                  fontSize: 13,
                  fontFamily: "monospace",
                  marginRight: 8,
                }}
              >
                BRL — Real
              </Text>
              <Ionicons color="#475569" name="chevron-down" size={16} />
            </Pressable>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <SectionTitle>PREFERÊNCIAS</SectionTitle>
          <View
            style={{
              backgroundColor: "#222A37",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
              }}
            >
              <RowIcon
                bg="rgba(238,192,92,0.1)"
                color="#EEC05C"
                name="moon-outline"
              />
              <Text
                style={{
                  flex: 1,
                  color: "#F1F5F9",
                  fontSize: 15,
                  fontWeight: "500",
                }}
              >
                Tema
              </Text>
              <View style={{ flexDirection: "row", gap: 4 }}>
                {THEME_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.key}
                    onPress={() => setTheme(opt.key)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor:
                        theme === opt.key
                          ? "rgba(173,198,255,0.1)"
                          : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme === opt.key ? "#ADC6FF" : "#475569",
                        fontWeight: theme === opt.key ? "600" : "400",
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Divider />

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
              }}
            >
              <RowIcon name="notifications-outline" />
              <Text
                style={{
                  flex: 1,
                  color: "#F1F5F9",
                  fontSize: 15,
                  fontWeight: "500",
                }}
              >
                Notificações
              </Text>
              <Switch
                onValueChange={setNotifications}
                thumbColor="#FFFFFF"
                trackColor={{ false: "#334155", true: "#ADC6FF" }}
                value={notifications}
              />
            </View>

            <Divider />

            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
              }}
            >
              <RowIcon name="globe-outline" />
              <Text
                style={{
                  flex: 1,
                  color: "#F1F5F9",
                  fontSize: 15,
                  fontWeight: "500",
                }}
              >
                Idioma
              </Text>
              <Text style={{ color: "#94A3B8", fontSize: 13, marginRight: 8 }}>
                Português (BR)
              </Text>
              <Ionicons color="#475569" name="chevron-forward" size={16} />
            </Pressable>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <SectionTitle>DADOS</SectionTitle>
          <View
            style={{
              backgroundColor: "#222A37",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
              }}
            >
              <RowIcon name="download-outline" />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#F1F5F9",
                    fontSize: 15,
                    fontWeight: "500",
                  }}
                >
                  Exportar dados
                </Text>
                <Text style={{ color: "#94A3B8", fontSize: 12, marginTop: 2 }}>
                  Exportar como CSV
                </Text>
              </View>
              <Ionicons color="#475569" name="chevron-forward" size={18} />
            </Pressable>

            <Divider />

            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
              }}
            >
              <RowIcon name="cloud-upload-outline" />
              <Text
                style={{
                  flex: 1,
                  color: "#F1F5F9",
                  fontSize: 15,
                  fontWeight: "500",
                }}
              >
                Backup e restauração
              </Text>
              <Ionicons color="#475569" name="chevron-forward" size={18} />
            </Pressable>

            <Divider />

            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
              }}
            >
              <RowIcon
                bg="rgba(239,68,68,0.1)"
                color="#EF4444"
                name="trash-outline"
              />
              <Text
                style={{
                  flex: 1,
                  color: "#EF4444",
                  fontSize: 15,
                  fontWeight: "500",
                }}
              >
                Limpar todos os dados
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <SectionTitle>SOBRE</SectionTitle>
          <View
            style={{
              backgroundColor: "#222A37",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
              }}
            >
              <RowIcon name="information-circle-outline" />
              <Text
                style={{
                  flex: 1,
                  color: "#F1F5F9",
                  fontSize: 15,
                  fontWeight: "500",
                }}
              >
                Versão do app
              </Text>
              <Text
                style={{
                  color: "#94A3B8",
                  fontSize: 13,
                  fontFamily: "monospace",
                }}
              >
                Bag Coin v1.0.0
              </Text>
            </View>

            <Divider />

            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
              }}
            >
              <RowIcon name="document-text-outline" />
              <Text
                style={{
                  flex: 1,
                  color: "#F1F5F9",
                  fontSize: 15,
                  fontWeight: "500",
                }}
              >
                Termos de uso
              </Text>
              <Ionicons color="#475569" name="open-outline" size={16} />
            </Pressable>

            <Divider />

            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
              }}
            >
              <RowIcon name="shield-checkmark-outline" />
              <Text
                style={{
                  flex: 1,
                  color: "#F1F5F9",
                  fontSize: 15,
                  fontWeight: "500",
                }}
              >
                Política de privacidade
              </Text>
              <Ionicons color="#475569" name="open-outline" size={16} />
            </Pressable>

            <Divider />

            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
              }}
            >
              <RowIcon name="help-circle-outline" />
              <Text
                style={{
                  flex: 1,
                  color: "#F1F5F9",
                  fontSize: 15,
                  fontWeight: "500",
                }}
              >
                Ajuda e suporte
              </Text>
              <Ionicons color="#475569" name="chevron-forward" size={18} />
            </Pressable>
          </View>
        </View>

        <Pressable
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "rgba(239,68,68,0.4)",
          }}
        >
          <Ionicons color="#EF4444" name="log-out-outline" size={20} />
          <Text style={{ color: "#EF4444", fontSize: 15, fontWeight: "600" }}>
            Sair da conta
          </Text>
        </Pressable>
      </View>
    </Container>
  );
};

export default ProfileScreen;
