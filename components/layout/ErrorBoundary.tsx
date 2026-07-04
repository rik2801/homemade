import { Component, type ErrorInfo, type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { AppText } from "@/components/primitives/AppText";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App render error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <View style={styles.root}>
        <AppText variant="title" style={styles.title}>
          Something went wrong
        </AppText>
        <ScrollView contentContainerStyle={styles.body}>
          <AppText style={styles.message}>{this.state.error.message}</AppText>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#FFFFFF",
    flex: 1,
    padding: 24,
    paddingTop: 72
  },
  title: {
    marginBottom: 16
  },
  body: {
    paddingBottom: 24
  },
  message: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20
  }
});
