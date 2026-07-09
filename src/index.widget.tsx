import { createRoot, Root } from "react-dom/client";
import App from "./App";
import "./index.css";

export interface WishlistWidgetOptions {
  containerElementId: string;
}

declare global {
  interface Window {
    renderReactWidget: (config: string) => void;
    unmountReactWidget: (containerId: string) => void;
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    HOST_USER_INFO: any;
  }
}

const roots: Record<string, Root> = {};
const userData = window.HOST_USER_INFO;
console.log("user data", userData)
console.log("user data id", userData?._id)
window.renderReactWidget = (config: string) => {
  let options: WishlistWidgetOptions;

  try {
    options = JSON.parse(config);
  } catch {
    console.error("Invalid widget config");
    return;
  }

  const container = document.getElementById(options.containerElementId);

  if (!container) {
    console.error(`Container '${options.containerElementId}' not found`);
    return;
  }

  if (roots[options.containerElementId]) {
    roots[options.containerElementId].unmount();
  }

  const root = createRoot(container);

  root.render(
        <App  userId={userData?._id}/>
  );

  roots[options.containerElementId] = root;
};

window.unmountReactWidget = (containerId: string) => {
  roots[containerId]?.unmount();
  delete roots[containerId];
};