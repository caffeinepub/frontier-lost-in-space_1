import { useEffect } from "react";
import { MobileControls } from "./components/Controls/MobileControls";
import GameCanvas from "./components/Game/GameCanvas";
import { PanelRouter } from "./components/UI/PanelRouter";
import { useDeviceStore } from "./stores/deviceStore";
import { useInventoryStore } from "./stores/inventoryStore";
import { useShipStore } from "./stores/shipStore";
import { SAVE_KEY } from "./utils/constants";

export default function App() {
  const { detectDevice } = useDeviceStore();

  useEffect(() => {
    detectDevice();
    window.addEventListener("resize", detectDevice);
    return () => window.removeEventListener("resize", detectDevice);
  }, [detectDevice]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const ship = useShipStore.getState();
      const inv = useInventoryStore.getState();
      const saveData = {
        hull: ship.hull,
        fuel: ship.fuel,
        resources: inv.resources,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#081626]">
      <GameCanvas />
      <PanelRouter />
      <MobileControls />
    </div>
  );
}
