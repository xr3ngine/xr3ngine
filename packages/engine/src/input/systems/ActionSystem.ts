import { LifecycleValue } from '../../common/enums/LifecycleValue'
import { NumericalType } from '../../common/types/NumericalTypes'
import { System, SystemAttributes } from '../../ecs/classes/System'
import { Not } from '../../ecs/functions/ComponentFunctions'
import { getComponent, getMutableComponent } from '../../ecs/functions/EntityFunctions'
import { SystemUpdateType } from '../../ecs/functions/SystemUpdateType'
import { Network } from '../../networking/classes/Network'
import { NetworkObject } from '../../networking/components/NetworkObject'
import { CharacterComponent } from '../../character/components/CharacterComponent'
import { Input } from '../components/Input'
import { LocalInputReceiver } from '../components/LocalInputReceiver'
import { XRInputSourceComponent } from '../../character/components/XRInputSourceComponent'
import { InputType } from '../enums/InputType'
import { InputValue } from '../interfaces/InputValue'
import { InputAlias } from '../types/InputAlias'
import { BaseInput } from '../enums/BaseInput'
import { EngineEvents } from '../../ecs/classes/EngineEvents'
import { ClientInputSystem } from './ClientInputSystem'
import { WEBCAM_INPUT_EVENTS } from '../constants/InputConstants'
import { Quaternion, Vector3 } from 'three'

const isBrowser = new Function('try {return this===window;}catch(e){ return false;}')

let faceToInput, lipToInput

if (isBrowser())
  import('../behaviors/WebcamInputBehaviors').then((imported) => {
    faceToInput = imported.faceToInput
    lipToInput = imported.lipToInput
  })

/**
 * Input System
 *
 * Property with prefix readonly makes a property as read-only in the class
 * @property {Number} leftControllerId set value 0
 * @property {Number} rightControllerId set value 1
 */

export class ActionSystem extends System {
  updateType = SystemUpdateType.Fixed
  receivedClientInputs = []

  constructor(attributes: SystemAttributes = {}) {
    super(attributes)

    EngineEvents.instance.addEventListener(WEBCAM_INPUT_EVENTS.FACE_INPUT, ({ detection }) => {
      faceToInput(Network.instance.localClientEntity, detection)
    })

    EngineEvents.instance.addEventListener(WEBCAM_INPUT_EVENTS.LIP_INPUT, ({ pucker, widen, open }) => {
      lipToInput(Network.instance.localClientEntity, pucker, widen, open)
    })

    EngineEvents.instance.addEventListener(ClientInputSystem.EVENTS.PROCESS_INPUT, ({ data }) => {
      this.receivedClientInputs.push(data)
    })
  }

  dispose(): void {
    // disposeVR();
    EngineEvents.instance.removeAllListenersForEvent(WEBCAM_INPUT_EVENTS.FACE_INPUT)
    EngineEvents.instance.removeAllListenersForEvent(WEBCAM_INPUT_EVENTS.LIP_INPUT)
    EngineEvents.instance.removeAllListenersForEvent(ClientInputSystem.EVENTS.PROCESS_INPUT)
  }

  /**
   *
   * @param {Number} delta Time since last frame
   */

  public execute(delta: number): void {
    this.queryResults.localClientInputXR.all?.forEach((entity) => {
      const xrInputSourceComponent = getComponent(entity, XRInputSourceComponent)
      const input = getMutableComponent(entity, Input)
      input.data.set(BaseInput.XR_HEAD, {
        type: InputType.SIXDOF,
        value: {
          x: xrInputSourceComponent.head.position.x,
          y: xrInputSourceComponent.head.position.y,
          z: xrInputSourceComponent.head.position.z,
          qW: xrInputSourceComponent.head.quaternion.w,
          qX: xrInputSourceComponent.head.quaternion.x,
          qY: xrInputSourceComponent.head.quaternion.y,
          qZ: xrInputSourceComponent.head.quaternion.z
        },
        lifecycleState: LifecycleValue.CHANGED
      })
      input.data.set(BaseInput.XR_CONTROLLER_LEFT_HAND, {
        type: InputType.SIXDOF,
        value: {
          x: xrInputSourceComponent.controllerLeft.position.x,
          y: xrInputSourceComponent.controllerLeft.position.y,
          z: xrInputSourceComponent.controllerLeft.position.z,
          qW: xrInputSourceComponent.controllerLeft.quaternion.w,
          qX: xrInputSourceComponent.controllerLeft.quaternion.x,
          qY: xrInputSourceComponent.controllerLeft.quaternion.y,
          qZ: xrInputSourceComponent.controllerLeft.quaternion.z
        },
        lifecycleState: LifecycleValue.CHANGED
      })
      input.data.set(BaseInput.XR_CONTROLLER_RIGHT_HAND, {
        type: InputType.SIXDOF,
        value: {
          x: xrInputSourceComponent.controllerRight.position.x,
          y: xrInputSourceComponent.controllerRight.position.y,
          z: xrInputSourceComponent.controllerRight.position.z,
          qW: xrInputSourceComponent.controllerRight.quaternion.w,
          qX: xrInputSourceComponent.controllerRight.quaternion.x,
          qY: xrInputSourceComponent.controllerRight.quaternion.y,
          qZ: xrInputSourceComponent.controllerRight.quaternion.z
        },
        lifecycleState: LifecycleValue.CHANGED
      })
    })

    this.queryResults.localClientInput.all?.forEach((entity) => {
      const input = getMutableComponent(entity, Input)

      // Apply input for local user input onto client
      const receivedClientInput = [...this.receivedClientInputs]
      this.receivedClientInputs = []
      receivedClientInput?.forEach((stateUpdate) => {
        // key is the input type enu, value is the input value
        stateUpdate.forEach((value: InputValue<NumericalType>, key: InputAlias) => {
          if (input.schema.inputMap.has(key)) {
            input.data.set(input.schema.inputMap.get(key), value)
          }
        })

        input.data.forEach((value: InputValue<NumericalType>, key: InputAlias) => {
          if (!input.prevData.has(key)) {
            return
          }

          if (value.type === InputType.BUTTON) {
            const prevValue = input.prevData.get(key)
            if (
              (prevValue.lifecycleState === LifecycleValue.STARTED &&
                value.lifecycleState === LifecycleValue.STARTED) ||
              (prevValue.lifecycleState === LifecycleValue.CONTINUED && value.lifecycleState === LifecycleValue.STARTED)
            ) {
              // auto-switch to CONTINUED
              value.lifecycleState = LifecycleValue.CONTINUED
            }
            return
          }

          if (value.lifecycleState === LifecycleValue.ENDED) {
            // ENDED here is a special case, like mouse position on mouse down
            return
          }

          value.lifecycleState =
            JSON.stringify(value.value) === JSON.stringify(input.prevData.get(key).value)
              ? LifecycleValue.UNCHANGED
              : LifecycleValue.CHANGED
        })

        // call input behaviors
        input.data.forEach((value: InputValue<NumericalType>, key: InputAlias) => {
          if (input.schema.behaviorMap.has(key)) {
            input.schema.behaviorMap.get(key)(entity, key, value, delta)
          }
        })

        // handleInput(entity, delta)

        // store prevData
        input.prevData.clear()
        input.data.forEach((value: InputValue<NumericalType>, key: InputAlias) => {
          input.prevData.set(key, value)
        })

        // Add all values in input component to schema
        input.data.forEach((value: any, key) => {
          if (value.type === InputType.BUTTON)
            Network.instance.clientInputState.buttons.push({
              input: key,
              value: value.value,
              lifecycleState: value.lifecycleState
            })
          else if (value.type === InputType.ONEDIM)
            Network.instance.clientInputState.axes1d.push({
              input: key,
              value: value.value,
              lifecycleState: value.lifecycleState
            })
          else if (value.type === InputType.TWODIM)
            Network.instance.clientInputState.axes2d.push({
              input: key,
              value: value.value,
              lifecycleState: value.lifecycleState
            })
          else if (value.type === InputType.SIXDOF)
            Network.instance.clientInputState.axes6DOF.push({ input: key, value: value.value })
        })

        const actor = getComponent(entity, CharacterComponent)
        if (actor) {
          Network.instance.clientInputState.viewVector.x = actor.viewVector.x
          Network.instance.clientInputState.viewVector.y = actor.viewVector.y
          Network.instance.clientInputState.viewVector.z = actor.viewVector.z
        }

        if (Network.instance.clientGameAction.length > 0) {
          console.warn(Network.instance.clientGameAction)
          Network.instance.clientGameAction = []
        }

        input.data.forEach((value: InputValue<NumericalType>, key: InputAlias) => {
          if (value.type === InputType.BUTTON) {
            if (value.lifecycleState === LifecycleValue.ENDED) {
              input.data.delete(key)
            }
          }
        })
      })
    })

    // Called when input component is added to entity
    this.queryResults.localClientInput.added?.forEach((entity) => {
      // Get component reference
      const input = getComponent(entity, Input)
      input.schema.onAdded(entity, delta)
    })

    // Called when input component is removed from entity
    this.queryResults.localClientInput.removed.forEach((entity) => {
      // Get component reference
      const input = getComponent(entity, Input, true)
      input.schema.onRemove(entity, delta)
    })
  }
}

/**
 * Queries must have components attribute which defines the list of components
 */
ActionSystem.queries = {
  networkClientInput: {
    components: [NetworkObject, Input, Not(LocalInputReceiver)],
    listen: {
      added: true,
      removed: true
    }
  },
  localClientInput: {
    components: [Input, LocalInputReceiver],
    listen: {
      added: true,
      removed: true
    }
  },
  localClientInputXR: {
    components: [Input, LocalInputReceiver, XRInputSourceComponent],
    listen: {
      added: true,
      removed: true
    }
  }
}
