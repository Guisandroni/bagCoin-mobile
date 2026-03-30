import { useChat } from "@ai-sdk/react";
import { env } from "@bagcoin/env/native";
import { Ionicons } from "@expo/vector-icons";
import { DefaultChatTransport } from "ai";
import { fetch as expoFetch } from "expo/fetch";
import { router } from "expo-router";
import {
  Button,
  FieldError,
  Input,
  Spinner,
  Surface,
  TextField,
  useThemeColor,
} from "heroui-native";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { Container } from "@/components/container";

const generateAPIUrl = (relativePath: string) => {
  const serverUrl = env.EXPO_PUBLIC_SERVER_URL;
  if (!serverUrl) {
    throw new Error(
      "EXPO_PUBLIC_SERVER_URL environment variable is not defined"
    );
  }
  const path = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  return serverUrl.concat(path);
};

export default function AIScreen() {
  const [input, setInput] = useState("");
  const { messages, error, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      fetch: expoFetch as unknown as typeof globalThis.fetch,
      api: generateAPIUrl("/ai"),
    }),
    onError: (err) => console.error(err, "AI Chat Error"),
  });
  const scrollViewRef = useRef<ScrollView>(null);
  const foregroundColor = useThemeColor("foreground");
  const mutedColor = useThemeColor("muted");
  const isBusy = status === "submitted" || status === "streaming";

  const messageCount = messages.length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message count change
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messageCount]);

  const onSubmit = () => {
    const value = input.trim();
    if (value && !isBusy) {
      sendMessage({ text: value });
      setInput("");
    }
  };

  if (error) {
    return (
      <Container isScrollable={false}>
        <View className="flex-1 items-center justify-center px-4">
          <Surface className="rounded-lg p-4" variant="secondary">
            <FieldError isInvalid>
              <Text className="mb-1 text-center font-medium text-danger">
                {error.message}
              </Text>
              <Text className="text-center text-muted text-xs">
                Verifique sua conexão e tente novamente.
              </Text>
            </FieldError>
          </Surface>
        </View>
      </Container>
    );
  }

  return (
    <Container isScrollable={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-4 py-4">
          <View className="mb-4 flex-row items-center justify-between">
            <Pressable
              className="h-9 w-9 items-center justify-center rounded-full active:opacity-60"
              onPress={() => router.back()}
              style={{ backgroundColor: "rgba(66,71,84,0.2)" }}
            >
              <Ionicons color={foregroundColor} name="close" size={20} />
            </Pressable>
            <View className="items-center">
              <Text className="font-bold text-foreground text-lg">AI Chat</Text>
              <Text className="text-muted text-xs">Assistente financeiro</Text>
            </View>
            <View className="w-9" />
          </View>

          <ScrollView
            className="mb-4 flex-1"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
            keyboardShouldPersistTaps="handled"
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <Surface
                className="flex-1 items-center justify-center rounded-xl py-8"
                variant="secondary"
              >
                <View
                  className="mb-3 h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: "rgba(238,192,92,0.12)" }}
                >
                  <Ionicons color="#EEC05C" name="sparkles" size={24} />
                </View>
                <Text className="mb-1 font-semibold text-base text-foreground">
                  Assistente BagCoin
                </Text>
                <Text className="px-8 text-center text-muted text-xs">
                  Pergunte sobre seus gastos, peça dicas de economia ou analise
                  suas finanças
                </Text>
              </Surface>
            ) : (
              <View className="gap-3">
                {messages.map((message) => (
                  <Surface
                    className={`rounded-xl p-3 ${message.role === "user" ? "ml-8" : "mr-8"}`}
                    key={message.id}
                    variant={message.role === "user" ? "tertiary" : "secondary"}
                  >
                    <Text className="mb-1 font-medium text-muted text-xs">
                      {message.role === "user" ? "Você" : "AI"}
                    </Text>
                    <View className="gap-1">
                      {message.parts.map((part, i) =>
                        part.type === "text" ? (
                          <Text
                            className="text-foreground text-sm leading-relaxed"
                            key={`${message.id}-${i}`}
                          >
                            {part.text}
                          </Text>
                        ) : (
                          <Text
                            className="text-foreground text-sm leading-relaxed"
                            key={`${message.id}-${i}`}
                          >
                            {JSON.stringify(part)}
                          </Text>
                        )
                      )}
                    </View>
                  </Surface>
                ))}
                {isBusy && (
                  <Surface className="mr-8 rounded-xl p-3" variant="secondary">
                    <Text className="mb-1 font-medium text-muted text-xs">
                      AI
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <Spinner size="sm" />
                      <Text className="text-muted text-sm">Pensando...</Text>
                    </View>
                  </Surface>
                )}
              </View>
            )}
          </ScrollView>

          <View className="flex-row items-center gap-2">
            <View className="flex-1">
              <TextField>
                <Input
                  editable={!isBusy}
                  onChangeText={setInput}
                  onSubmitEditing={onSubmit}
                  placeholder="Pergunte sobre suas finanças..."
                  returnKeyType="send"
                  value={input}
                />
              </TextField>
            </View>
            <Button
              isDisabled={!input.trim() || isBusy}
              isIconOnly
              onPress={onSubmit}
              size="sm"
              variant={input.trim() && !isBusy ? "primary" : "secondary"}
            >
              <Ionicons
                color={input.trim() && !isBusy ? foregroundColor : mutedColor}
                name="arrow-up"
                size={18}
              />
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
}
