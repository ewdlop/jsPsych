import { JsPsych } from "../../JsPsych";
import { KeyboardListenerAPI } from "./KeyboardListenerAPI";
import { MediaAPI } from "./MediaAPI";
import { SimulationAPI } from "./SimulationAPI";
import { TimeoutAPI } from "./TimeoutAPI";

/**
 * Merges multiple objects by copying all methods and properties from their prototypes.
 * This replaces the autoBind functionality we previously used.
 */
function mergeAPIs<T extends object[]>(...objects: T): any {
  const merged = {};
  
  for (const obj of objects) {
    // Copy own properties (fields)
    Object.assign(merged, obj);
    
    // Copy methods from the prototype
    const proto = Object.getPrototypeOf(obj);
    const methodNames = Object.getOwnPropertyNames(proto).filter(
      name => name !== 'constructor' && typeof proto[name] === 'function'
    );
    
    for (const name of methodNames) {
      merged[name] = obj[name].bind(obj);
    }
  }
  
  return merged;
}

export function createJointPluginAPIObject(jsPsych: JsPsych) {
  const settings = jsPsych.getInitSettings();
  const keyboardListenerAPI = new KeyboardListenerAPI(
    jsPsych.getDisplayContainerElement.bind(jsPsych),
    settings.case_sensitive_responses,
    settings.minimum_valid_rt
  );
  const timeoutAPI = new TimeoutAPI();
  const mediaAPI = new MediaAPI(settings.use_webaudio);
  const simulationAPI = new SimulationAPI(
    jsPsych.getDisplayContainerElement.bind(jsPsych),
    timeoutAPI.setTimeout.bind(timeoutAPI)
  );
  return mergeAPIs(
    keyboardListenerAPI,
    timeoutAPI,
    mediaAPI,
    simulationAPI
  ) as KeyboardListenerAPI & TimeoutAPI & MediaAPI & SimulationAPI;
}

export type PluginAPI = ReturnType<typeof createJointPluginAPIObject>;
