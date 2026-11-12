import AppTabs from "@/components/app-tabs";
import { TabBarVisibilityProvider } from "@/context/tab-bar-visibility-context";

export default function TabsLayout() {
  return (
    <TabBarVisibilityProvider>
      <AppTabs />
    </TabBarVisibilityProvider>
  );
}
