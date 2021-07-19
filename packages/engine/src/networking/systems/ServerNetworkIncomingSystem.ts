import { LifecycleValue } from '../../common/enums/LifecycleValue'
import { NumericalType, SIXDOFType } from '../../common/types/NumericalTypes'
import { System } from '../../ecs/classes/System'
import { addComponent, getComponent, getMutableComponent, hasComponent } from '../../ecs/functions/EntityFunctions'
import { SystemUpdateType } from '../../ecs/functions/SystemUpdateType'
import { DelegatedInputReceiver } from '../../input/components/DelegatedInputReceiver'
import { Input } from '../../input/components/Input'
import { InputType } from '../../input/enums/InputType'
import { InputValue } from '../../input/interfaces/InputValue'
import { InputAlias } from '../../input/types/InputAlias'
import { CharacterComponent } from '../../character/components/CharacterComponent'
import { Network } from '../classes/Network'
import { NetworkObject } from '../components/NetworkObject'
import { NetworkSchema } from '../interfaces/NetworkSchema'
import { NetworkClientInputInterface } from '../interfaces/WorldState'
import { ClientInputModel } from '../schema/clientInputSchema'
import { WorldStateModel } from '../schema/worldStateSchema'
import { GamePlayer } from '../../game/components/GamePlayer'
import { sendSpawnGameObjects, sendState } from '../../game/functions/functionsState'
import { getGameFromName } from '../../game/functions/functions'
import { XRInputSourceComponent } from '../../character/components/XRInputSourceComponent'
import { BaseInput } from '../../input/enums/BaseInput'
import { Quaternion } from 'three'
import { executeCommands } from '../functions/executeCommands'
import { ClientActionToServer } from '../../game/templates/DefaultGameStateAction'

export function cancelAllInputs(entity) {
  getMutableComponent(entity, Input)?.data.forEach((value) => {
    value.lifecycleState = LifecycleValue.ENDED
  })
}

/** System class to handle incoming messages. */
export class ServerNetworkIncomingSystem extends System {
  /** Update type of this system. **Default** to
   * {@link ecs/functions/SystemUpdateType.SystemUpdateType.Fixed | Fixed} type. */
  updateType = SystemUpdateType.Fixed

  /**
   * Constructs the system.
   * @param attributes Attributes to be passed to super class constructor.
   */
  constructor(attributes: { schema: NetworkSchema; app: any }) {
    super(attributes)

    const { schema, app } = attributes
    Network.instance.schema = schema
    // Instantiate the provided transport (SocketWebRTCClientTransport / SocketWebRTCServerTransport by default)
    Network.instance.transport = new schema.transport(app)

    // Initialize the server automatically - client is initialized in connectToServer
    if (
      process.env.SERVER_MODE !== undefined &&
      (process.env.SERVER_MODE === 'realtime' || process.env.SERVER_MODE === 'local')
    ) {
      Network.instance.transport.initialize()
      Network.instance.isInitialized = true
    }
  }

  /** Call execution on server */
  execute = (delta: number): void => {
    // Create a new worldstate frame for next tick
    Network.instance.tick++

    // Set input values on server to values sent from clients
    // Parse incoming message queue
    while (Network.instance.incomingMessageQueueReliable.getBufferLength() > 0) {
      const buffer = Network.instance.incomingMessageQueueReliable.pop() as any

      let clientInput: NetworkClientInputInterface
      try {
        clientInput = ClientInputModel.fromBuffer(buffer)
      } catch (error) {
        try {
          WorldStateModel.fromBuffer(buffer)
          console.warn('Server is sending receiving its own outgoing messages...', error, buffer)
          return
        } catch (error) {
          console.warn('Unknown or corrupt data is entering the incoming server message stream', error, buffer)
          return
        }
      }
      if (!clientInput) return

      // TODO: Handle client incoming state actions
      // Are they host or not?
      // Validate against host or non/host actions
      // If action is valid, apply behavior for server
      // Game state updated = true

      // Outside of for loop, if game state updated is true, flag update world state

      // Add handlers to game state schema, valid requests should get added to the GameStateActions queue on the server

      if (Network.instance.networkObjects[clientInput.networkId] === undefined) {
        // console.error('Network object not found for networkId', clientInput.networkId);
        return
      }

      const delegatedInputReceiver = getComponent(
        Network.instance.networkObjects[clientInput.networkId].component.entity,
        DelegatedInputReceiver
      )
      const inputClientNetworkId = delegatedInputReceiver ? delegatedInputReceiver.networkId : clientInput.networkId
      const entity = Network.instance.networkObjects[clientInput.networkId].component.entity
      const entityInputReceiver = Network.instance.networkObjects[inputClientNetworkId].component.entity

      if (clientInput.clientGameAction.length > 0) {
        clientInput.clientGameAction.forEach((action) => {
          const playerComp = getComponent<GamePlayer>(entity, GamePlayer)
          if (playerComp === undefined) return
          if (action.type === ClientActionToServer[0]) {
            sendState(getGameFromName(playerComp.gameName), playerComp)
          } else if (action.type === ClientActionToServer[1]) {
            sendSpawnGameObjects(getGameFromName(playerComp.gameName), action.uuid)
          }
        })
      }

      if (clientInput.commands.length > 0) {
        executeCommands(entity, clientInput.commands)
      }

      const actor = getMutableComponent(entity, CharacterComponent)

      if (actor) {
        actor.viewVector.set(clientInput.viewVector.x, clientInput.viewVector.y, clientInput.viewVector.z)
      } else {
        console.log('input but no actor...', clientInput.networkId)
      }

      const userNetworkObject = getMutableComponent(entity, NetworkObject)
      if (userNetworkObject != null) {
        userNetworkObject.snapShotTime = clientInput.snapShotTime
        if (userNetworkObject.snapShotTime > clientInput.snapShotTime) return
      }

      // this snapShotTime which will be sent bac k to the client, so that he knows exactly what inputs led to the change and when it was.

      // Get input component
      const input = getMutableComponent(entityInputReceiver, Input)
      if (!input) {
        return
      }
      // Clear current data
      input.data.clear()

      // Apply button input
      for (let i = 0; i < clientInput.buttons.length; i++) {
        input.data.set(clientInput.buttons[i].input, {
          type: InputType.BUTTON,
          value: clientInput.buttons[i].value,
          lifecycleState: clientInput.buttons[i].lifecycleState
        })
      }
      // Axis 1D input
      for (let i = 0; i < clientInput.axes1d.length; i++)
        input.data.set(clientInput.axes1d[i].input, {
          type: InputType.ONEDIM,
          value: clientInput.axes1d[i].value,
          lifecycleState: clientInput.axes1d[i].lifecycleState
        })

      // Axis 2D input
      for (let i = 0; i < clientInput.axes2d.length; i++)
        input.data.set(clientInput.axes2d[i].input, {
          type: InputType.TWODIM,
          value: clientInput.axes2d[i].value,
          lifecycleState: clientInput.axes2d[i].lifecycleState
        })

      // Axis 6DOF input
      for (let i = 0; i < clientInput.axes6DOF.length; i++) {
        input.data.set(clientInput.axes6DOF[i].input, {
          type: InputType.SIXDOF,
          value: clientInput.axes6DOF[i].value,
          lifecycleState: LifecycleValue.CONTINUED
        })
      }

      if (clientInput.axes6DOF.length && !hasComponent(entity, XRInputSourceComponent)) {
        addComponent(entity, XRInputSourceComponent)
      }

      // call input behaviors
      input.data.forEach((value: InputValue<NumericalType>, key: InputAlias) => {
        if (input.schema.behaviorMap.has(key)) {
          input.schema.behaviorMap.get(key)(entity, key, value, delta)
        }
      })
    }

    // Apply input for local user input onto client
    this.queryResults.networkObjectsWithInput.all?.forEach((entity) => {
      //  const actor = getMutableComponent(entity, CharacterComponent);
      const input = getMutableComponent(entity, Input)

      input.data.forEach((value: InputValue<NumericalType>, key: InputAlias) => {
        // If the input is a button
        if (value.type === InputType.BUTTON) {
          // If the input exists on the input map (otherwise ignore it)
          if (value.lifecycleState === LifecycleValue.ENDED) {
            input.data.delete(key)
          }
        }
      })
    })

    this.queryResults.networkObjectsWithInput.added?.forEach((entity) => {
      const input = getComponent(entity, Input)
      input.schema.onAdded(entity, delta)
    })

    this.queryResults.networkObjectsWithInput.removed?.forEach((entity) => {
      const input = getComponent(entity, Input, true)
      input.schema.onRemove(entity, delta)
    })

    this.queryResults.delegatedInputRouting.added?.forEach((entity) => {
      const networkId = getComponent(entity, DelegatedInputReceiver).networkId
      if (Network.instance.networkObjects[networkId]) {
        cancelAllInputs(Network.instance.networkObjects[networkId].component.entity)
      }
      cancelAllInputs(entity)
    })
    this.queryResults.delegatedInputRouting.removed?.forEach((entity) => {
      cancelAllInputs(entity)
    })

    // Handle server input from client
    this.queryResults.networkClientInputXR.all?.forEach((entity) => {
      const xrInputSourceComponent = getMutableComponent(entity, XRInputSourceComponent)

      const inputs = getMutableComponent(entity, Input)

      if (!inputs.data.has(BaseInput.XR_HEAD)) return

      const head = inputs.data.get(BaseInput.XR_HEAD).value as SIXDOFType
      const left = inputs.data.get(BaseInput.XR_CONTROLLER_LEFT_HAND).value as SIXDOFType
      const right = inputs.data.get(BaseInput.XR_CONTROLLER_RIGHT_HAND).value as SIXDOFType

      xrInputSourceComponent.head.position.set(head.x, head.y, head.z)
      xrInputSourceComponent.head.quaternion.set(head.qX, head.qY, head.qZ, head.qW)

      xrInputSourceComponent.controllerLeft.position.set(left.x, left.y, left.z)
      xrInputSourceComponent.controllerLeft.quaternion.set(left.qX, left.qY, left.qZ, left.qW)

      xrInputSourceComponent.controllerRight.position.set(right.x, right.y, right.z)
      xrInputSourceComponent.controllerRight.quaternion.set(right.qX, right.qY, right.qZ, right.qW)
    })
  }

  /** Queries of the system. */
  static queries: any = {
    delegatedInputRouting: {
      components: [DelegatedInputReceiver],
      listen: {
        added: true,
        removed: true
      }
    },
    networkObjectsWithInput: {
      components: [NetworkObject, Input],
      listen: {
        added: true,
        removed: true
      }
    },
    networkClientInputXR: {
      components: [Input, XRInputSourceComponent],
      listen: {
        added: true,
        removed: true
      }
    }
  }
}
