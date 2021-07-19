import { Box3, Frustum, Matrix4, Mesh, Object3D, Vector3 } from 'three'
import { FollowCameraComponent } from '../../camera/components/FollowCameraComponent'
import { isClient } from '../../common/functions/isClient'
import { vectorToScreenXYZ } from '../../common/functions/vectorToScreenXYZ'
import { Behavior } from '../../common/interfaces/Behavior'
import { Engine } from '../../ecs/classes/Engine'
import { EngineEvents } from '../../ecs/classes/EngineEvents'
import { Entity } from '../../ecs/classes/Entity'
import { System, SystemAttributes } from '../../ecs/classes/System'
import { Not } from '../../ecs/functions/ComponentFunctions'
import {
  addComponent,
  getComponent,
  getMutableComponent,
  hasComponent,
  removeComponent
} from '../../ecs/functions/EntityFunctions'
import { SystemUpdateType } from '../../ecs/functions/SystemUpdateType'
import { LocalInputReceiver } from '../../input/components/LocalInputReceiver'
import { NetworkObject } from '../../networking/components/NetworkObject'
import { RigidBodyComponent } from '../../physics/components/RigidBody'
import { HighlightComponent } from '../../renderer/components/HighlightComponent'
import { Object3DComponent } from '../../scene/components/Object3DComponent'
import { CharacterComponent } from '../../character/components/CharacterComponent'
import { NamePlateComponent } from '../../character/components/NamePlateComponent'
import { VehicleComponent } from '../../vehicle/components/VehicleComponent'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { BoundingBox } from '../components/BoundingBox'
import { Interactable } from '../components/Interactable'
import { InteractiveFocused } from '../components/InteractiveFocused'
import { Interactor } from '../components/Interactor'
import { SubFocused } from '../components/SubFocused'
import { InteractBehaviorArguments } from '../types/InteractionTypes'
import { HasHadInteraction } from '../../game/actions/HasHadInteraction'
import { addActionComponent } from '../../game/functions/functionsActions'
import { EquipperComponent } from '../components/EquipperComponent'
import { EquippedStateUpdateSchema } from '../enums/EquippedEnums'
import { ColliderComponent } from '../../physics/components/ColliderComponent'
import { NetworkObjectUpdateType } from '../../networking/templates/NetworkObjectUpdateSchema'
import { sendClientObjectUpdate } from '../../networking/functions/sendClientObjectUpdate'
import { BodyType } from 'three-physx'
import { BinaryValue } from '../../common/enums/BinaryValue'
import { ParityValue } from '../../common/enums/ParityValue'
import {
  getInteractiveIsInReachDistance,
  interactiveReachDistance
} from '../../character/functions/getInteractiveIsInReachDistance'
import { getHandTransform } from '../../xr/functions/WebXRFunctions'
import { unequipEntity } from '../functions/equippableFunctions'

const vector3 = new Vector3()
// but is works on client too, i will config out this
export const interactOnServer: Behavior = (entity: Entity, parityValue, delta): void => {
  //console.warn('Behavior: interact , networkId ='+getComponent(entity, NetworkObject).networkId);

  const equipperComponent = getComponent(entity, EquipperComponent)
  if (equipperComponent) {
    unequipEntity(entity)
    return
  }

  let focusedArrays = []
  for (let i = 0; i < Engine.entities.length; i++) {
    const isEntityInteractable = Engine.entities[i]
    if (hasComponent(isEntityInteractable, Interactable)) {
      const interactive = getComponent(isEntityInteractable, Interactable)
      const intPosition = getComponent(isEntityInteractable, TransformComponent).position
      const intRotation = getComponent(isEntityInteractable, TransformComponent).rotation
      const position = getComponent(entity, TransformComponent).position

      if (interactive.interactionPartsPosition.length > 0) {
        interactive.interactionPartsPosition.forEach((v, i) => {
          const partPosition = vector3.set(v[0], v[1], v[2]).applyQuaternion(intRotation).add(intPosition)
          if (getInteractiveIsInReachDistance(entity, intPosition, parityValue)) {
            focusedArrays.push([isEntityInteractable, position.distanceTo(partPosition), i])
          }
        })
      } else {
        if (getInteractiveIsInReachDistance(entity, intPosition, parityValue)) {
          if (typeof interactive.onInteractionCheck === 'function') {
            if (interactive.onInteractionCheck(entity, isEntityInteractable, null)) {
              focusedArrays.push([isEntityInteractable, position.distanceTo(intPosition), null])
            }
          } else {
            focusedArrays.push([isEntityInteractable, position.distanceTo(intPosition), null])
          }
        }
      }
    }
  }

  focusedArrays = focusedArrays.sort((a: any, b: any) => a[1] - b[1])
  if (focusedArrays.length < 1) return

  const interactable = getComponent(focusedArrays[0][0], Interactable)
  const interactionCheck = interactable.onInteractionCheck(entity, focusedArrays[0][0], focusedArrays[0][2])

  if (interactable.data.interactionType === 'gameobject') {
    addActionComponent(focusedArrays[0][0], HasHadInteraction, {
      args: { side: parityValue },
      entityNetworkId: getComponent(entity, NetworkObject).networkId
    })
    return
  }
  // Not Game Object
  if (interactionCheck) {
    //  console.warn('start with networkId: '+getComponent(focusedArrays[0][0], NetworkObject).networkId+' seat: '+focusedArrays[0][2]);
    interactable.onInteraction(
      entity,
      { side: parityValue, currentFocusedPart: focusedArrays[0][2] },
      delta,
      focusedArrays[0][0]
    )
  }
}

export const subFocused: Behavior = (entity: Entity, args, delta: number): void => {
  if (!hasComponent(entity, Interactable)) {
    console.error('Attempted to call interact behavior, but target does not have Interactive component')
    return
  }
  hasComponent(entity, SubFocused)
    ? addComponent(entity, HighlightComponent, { color: 0xff0000, hiddenColor: 0x0000ff })
    : removeComponent(entity, HighlightComponent)
}

const interactFocused: Behavior = (entity: Entity, args, delta: number): void => {
  if (!hasComponent(entity, Interactable)) {
    console.error('Attempted to call interact behavior, but target does not have Interactive component')
    return
  }

  const focused = hasComponent(entity, InteractiveFocused)
  const subFocused = hasComponent(entity, SubFocused)

  const interactive = getComponent(entity, Interactable)

  if (interactive && typeof interactive.onInteractionFocused === 'function') {
    const entityFocuser = focused ? getComponent(entity, InteractiveFocused).interacts : null
    interactive.onInteractionFocused(entityFocuser, { focused }, delta, entity)
  }
}

/**
 * Checks if entity can interact with any of entities listed in 'interactive' array, checking distance, guards and raycast
 * @param entity
 * @param interactive
 * @param delta
 */

const interactBoxRaycast: Behavior = (
  entity: Entity,
  { raycastList }: InteractBehaviorArguments,
  delta: number
): void => {
  const interacts = getMutableComponent(entity, Interactor)
  if (!hasComponent(entity, FollowCameraComponent)) {
    interacts.subFocusedArray = []
    interacts.focusedInteractive = null
    return
  }

  const followCamera = getComponent(entity, FollowCameraComponent)
  if (!followCamera.raycastBoxOn) return

  const transform = getComponent<TransformComponent>(entity, TransformComponent)

  if (!raycastList.length) {
    return
  }

  const projectionMatrix = new Matrix4().makePerspective(
    followCamera.rx1,
    followCamera.rx2,
    followCamera.ry1,
    followCamera.ry2,
    Engine.camera.near,
    followCamera.farDistance
  )

  Engine.camera.updateMatrixWorld()
  Engine.camera.matrixWorldInverse.copy(Engine.camera.matrixWorld).invert()

  const viewProjectionMatrix = new Matrix4().multiplyMatrices(projectionMatrix, Engine.camera.matrixWorldInverse)
  const frustum = new Frustum().setFromProjectionMatrix(viewProjectionMatrix)

  type RaycastResult = [Entity, boolean, number?, number?]
  const subFocusedArray = raycastList
    .map((entityIn): RaycastResult => {
      const boundingBox = getComponent(entityIn, BoundingBox)
      const interactive = getComponent(entityIn, Interactable)
      if (boundingBox.boxArray.length) {
        // TO DO: static group object

        if (boundingBox.dynamic) {
          const arr = boundingBox.boxArray
            .map((object3D, index): RaycastResult => {
              if (interactive.onInteractionCheck(entity, entityIn, index)) {
                const aabb = new Box3()
                aabb.setFromObject(object3D)
                return [entityIn, frustum.intersectsBox(aabb), aabb.distanceToPoint(transform.position), index]
              }
              return [entityIn, false, null, index]
            })
            .filter((value) => value[1])
            .sort((a: any, b: any) => a[2] - b[2])

          if (arr.length) {
            return arr[0]
          } else {
            return [null, false]
          }
        }
      } else {
        if (boundingBox.dynamic) {
          const object3D = getComponent(entityIn, Object3DComponent)
          const aabb = new Box3()
          aabb.copy(boundingBox.box)
          aabb.applyMatrix4(object3D.value.matrixWorld)
          return [entityIn, frustum.intersectsBox(aabb), aabb.distanceToPoint(transform.position)]
        } else {
          return [entityIn, frustum.intersectsBox(boundingBox.box), boundingBox.box.distanceToPoint(transform.position)]
        }
      }
    })
    .filter((value) => value[1])

  if (!subFocusedArray.length) {
    interacts.subFocusedArray = []
    interacts.focusedInteractive = null
    return
  }

  interacts.subFocusedArray = subFocusedArray.map((v: any) => [getComponent(v[0], Object3DComponent).value, v[3]])

  const [entityInteractable, doesIntersectFrustrum, distanceToPlayer] = subFocusedArray.sort(
    (a: any, b: any) => a[2] - b[2]
  )[0]

  const interactable = getComponent(entityInteractable, Interactable)
  const distance =
    typeof interactable.data.interactionDistance !== 'undefined'
      ? interactable.data.interactionDistance
      : interactiveReachDistance

  const resultIsCloseEnough = distanceToPlayer < distance
  if (resultIsCloseEnough) {
    interacts.focusedInteractive = entityInteractable
  }
}

export class InteractiveSystem extends System {
  static EVENTS = {
    USER_HOVER: 'INTERACTIVE_SYSTEM_USER_HOVER',
    OBJECT_HOVER: 'INTERACTIVE_SYSTEM_OBJECT_HOVER',
    OBJECT_ACTIVATION: 'INTERACTIVE_SYSTEM_OBJECT_ACTIVATION'
  }
  updateType = SystemUpdateType.Fixed

  /**
   * Elements that was in focused state on last execution
   */
  focused: Set<Entity>
  /**
   * Elements that are focused on current execution
   */
  newFocused: Set<Entity>
  previousEntity: Entity
  previousEntity2DPosition: Vector3

  constructor(attributes: SystemAttributes = {}) {
    super(attributes)

    this.reset()
  }

  reset(): void {
    this.previousEntity = null
    this.previousEntity2DPosition = null
    this.focused = new Set<Entity>()
    this.newFocused = new Set<Entity>()
  }

  dispose(): void {
    super.dispose()
    this.reset()

    EngineEvents.instance.removeAllListenersForEvent(InteractiveSystem.EVENTS.USER_HOVER)
    EngineEvents.instance.removeAllListenersForEvent(InteractiveSystem.EVENTS.OBJECT_ACTIVATION)
    EngineEvents.instance.removeAllListenersForEvent(InteractiveSystem.EVENTS.OBJECT_HOVER)
  }

  execute(delta: number, time: number): void {
    this.newFocused.clear()
    if (isClient) {
      const canvas = Engine.renderer.domElement
      const width = canvas.width
      const height = canvas.height

      this.queryResults.local_user?.all.forEach((entity) => {
        const camera = Engine.camera

        const localTransform = getComponent(entity, TransformComponent)
        const localCharacter = getComponent(entity, CharacterComponent)

        const closestHoveredUser = this.queryResults.network_user.all
          ?.filter((entity) => {
            const transform = getComponent(entity, TransformComponent)
            const dir = transform.position.clone().sub(localTransform.position).normalize()
            return localCharacter.viewVector.dot(dir) > 0.7
          })
          ?.reduce((closestEntity, currentEntity) => {
            if (!closestEntity) {
              return currentEntity
            }
            const closestTransform = getComponent(closestEntity, TransformComponent)
            const currentTransform = getComponent(currentEntity, TransformComponent)

            if (
              currentTransform.position.distanceTo(localTransform.position) <
              closestTransform.position.distanceTo(localTransform.position)
            ) {
              return currentEntity
            } else {
              return closestEntity
            }
          }, null)

        if (!closestHoveredUser) {
          if (this.previousEntity) {
            EngineEvents.instance.dispatchEvent({ type: InteractiveSystem.EVENTS.USER_HOVER, focused: false })

            this.previousEntity = null
            this.previousEntity2DPosition = null
          }
          return
        }

        const networkUserID = getComponent(closestHoveredUser, NetworkObject)?.ownerId
        const closestPosition = getComponent(closestHoveredUser, TransformComponent).position.clone()
        closestPosition.y = 2
        const point2DPosition = vectorToScreenXYZ(closestPosition, camera, width, height)

        const nameplateData = {
          userId: networkUserID,
          position: {
            x: point2DPosition.x,
            y: point2DPosition.y,
            z: point2DPosition.z
          },
          focused: true
        }

        if (!this.previousEntity2DPosition || !point2DPosition.equals(this.previousEntity2DPosition)) {
          if (closestHoveredUser !== this.previousEntity) {
            this.previousEntity = closestHoveredUser
            this.previousEntity2DPosition = point2DPosition
          } else if (localTransform.position.distanceTo(closestPosition) >= 5) {
            nameplateData.focused = false
          }
          EngineEvents.instance.dispatchEvent({ type: InteractiveSystem.EVENTS.USER_HOVER, ...nameplateData })
        }
      })

      this.queryResults.interactors?.all.forEach((entity) => {
        if (this.queryResults.interactive?.all.length) {
          //interactRaycast(entity, { interactive: this.queryResults.interactive.all });
          interactBoxRaycast(entity, { raycastList: this.queryResults.boundingBox.all })
          const interacts = getComponent(entity, Interactor)
          if (interacts.focusedInteractive) {
            this.newFocused.add(interacts.focusedInteractive)
            // TODO: can someone else focus object? should we update 'interacts' entity
            if (!hasComponent(interacts.focusedInteractive, InteractiveFocused)) {
              addComponent(interacts.focusedInteractive, InteractiveFocused, { interacts: entity })
            }
          }

          // unmark all unfocused
          this.queryResults.interactive?.all.forEach((entityInter) => {
            if (
              !hasComponent(entityInter, BoundingBox) &&
              hasComponent(entityInter, Object3DComponent) &&
              hasComponent(entityInter, TransformComponent)
            ) {
              addComponent(entityInter, BoundingBox, {
                dynamic: hasComponent(entityInter, RigidBodyComponent) || hasComponent(entityInter, VehicleComponent)
              })
            }
            if (entityInter !== interacts.focusedInteractive && hasComponent(entityInter, InteractiveFocused)) {
              removeComponent(entityInter, InteractiveFocused)
            }
            if (interacts.subFocusedArray.some((v) => v[0].entity === entityInter)) {
              if (!hasComponent(entityInter, SubFocused)) {
                addComponent(entityInter, SubFocused)
              }
            } else {
              removeComponent(entityInter, SubFocused)
            }
          })
        }
      })

      this.queryResults.boundingBox.added?.forEach((entity) => {
        const interactive = getMutableComponent(entity, Interactable)
        const calcBoundingBox = getMutableComponent(entity, BoundingBox)

        const object3D = getMutableComponent(entity, Object3DComponent).value
        const transform = getComponent(entity, TransformComponent)

        object3D.position.copy(transform.position)
        object3D.rotation.setFromQuaternion(transform.rotation)
        calcBoundingBox.dynamic ? '' : object3D.updateMatrixWorld()

        if (interactive.interactionParts.length) {
          const arr = interactive.interactionParts.map((name) => object3D.children[0].getObjectByName(name))
          calcBoundingBox.boxArray = arr
        } else {
          const aabb = new Box3()
          object3D.traverse((v) => {
            //object3D instanceof Object3D aabb.setFromCenterAndSize(new Vector3(0, 0, 0), new Vector3(0.5, 0.5, 0.5))
            if (v instanceof Mesh) {
              v.geometry.boundingBox == null ? v.geometry.computeBoundingBox() : ''
              aabb.copy(v.geometry.boundingBox)
              calcBoundingBox.dynamic ? '' : aabb.applyMatrix4(v.matrixWorld)
              calcBoundingBox.box = aabb
              return
            }
          })
        }
      })

      // removal is the first because the hint must first be deleted, and then a new one appears
      this.queryResults.focus.removed?.forEach((entity) => {
        interactFocused(entity, null, delta)
      })

      this.queryResults.focus.added?.forEach((entity) => {
        interactFocused(entity, null, delta)
      })

      this.queryResults.subfocus.added?.forEach((entity) => {
        subFocused(entity, null, delta)
      })
      this.queryResults.subfocus.removed?.forEach((entity) => {
        subFocused(entity, null, delta)
      })

      this.focused.clear()
      this.newFocused.forEach((e) => this.focused.add(e))
    }

    this.queryResults.equippable.added?.forEach((entity) => {
      const equippedEntity = getComponent(entity, EquipperComponent).equippedEntity
      // all equippables must have a collider to grab by in VR
      const collider = getComponent(equippedEntity, ColliderComponent)
      if (collider) collider.body.type = BodyType.KINEMATIC
      // send equip to clients
      if (!isClient) {
        const networkObject = getComponent(equippedEntity, NetworkObject)
        sendClientObjectUpdate(entity, NetworkObjectUpdateType.ObjectEquipped, [
          BinaryValue.TRUE,
          networkObject.networkId
        ] as EquippedStateUpdateSchema)
      }
    })

    this.queryResults.equippable.all?.forEach((entity) => {
      const equipperComponent = getComponent(entity, EquipperComponent)
      const equippableTransform = getComponent(equipperComponent.equippedEntity, TransformComponent)
      const handTransform = getHandTransform(entity)
      const { position, rotation } = handTransform
      equippableTransform.position.copy(position)
      equippableTransform.rotation.copy(rotation)
      if (!isClient) {
        this.queryResults.network_user.added.forEach((userEntity) => {
          const networkObject = getComponent(equipperComponent.equippedEntity, NetworkObject)
          sendClientObjectUpdate(entity, NetworkObjectUpdateType.ObjectEquipped, [
            BinaryValue.TRUE,
            networkObject.networkId
          ] as EquippedStateUpdateSchema)
        })
      }
    })

    this.queryResults.equippable.removed?.forEach((entity) => {
      const equipperComponent = getComponent(entity, EquipperComponent, true)
      const equippedEntity = equipperComponent.equippedEntity
      const equippedTransform = getComponent(equippedEntity, TransformComponent)
      const collider = getComponent(equippedEntity, ColliderComponent)
      if (collider) {
        collider.body.type = BodyType.DYNAMIC
        collider.body.updateTransform({
          translation: equippedTransform.position,
          rotation: equippedTransform.rotation
        })
      }
      // send unequip to clients
      if (!isClient) {
        sendClientObjectUpdate(entity, NetworkObjectUpdateType.ObjectEquipped, [
          BinaryValue.FALSE
        ] as EquippedStateUpdateSchema)
      }
    })
  }

  static queries: any = {
    interactors: { components: [Interactor] },
    interactive: { components: [Interactable] },
    boundingBox: {
      components: [BoundingBox],
      listen: {
        added: true,
        removed: true
      }
    },
    focus: {
      components: [Interactable, InteractiveFocused],
      listen: {
        added: true,
        removed: true
      }
    },
    subfocus: {
      components: [Interactable, SubFocused],
      listen: {
        added: true,
        removed: true
      }
    },
    local_user: {
      components: [LocalInputReceiver, CharacterComponent, TransformComponent],
      listen: {
        added: true,
        removed: true
      }
    },
    network_user: {
      components: [Not(LocalInputReceiver), NamePlateComponent, CharacterComponent, TransformComponent],
      listen: {
        added: true,
        removed: true
      }
    },
    equippable: {
      components: [EquipperComponent],
      listen: {
        added: true,
        removed: true
      }
    }
  }
}
