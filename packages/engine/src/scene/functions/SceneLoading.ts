import {
  AmbientLight,
  AnimationClip,
  AnimationMixer,
  DirectionalLight,
  HemisphereLight,
  LoopRepeat,
  PointLight,
  SpotLight,
  Vector3
} from 'three'
import { isClient } from '../../common/functions/isClient'
import { Engine } from '../../ecs/classes/Engine'
import { EngineEvents } from '../../ecs/classes/EngineEvents'
import { Entity } from '../../ecs/classes/Entity'
import { addComponent, createEntity, getComponent, getMutableComponent } from '../../ecs/functions/EntityFunctions'
import { SceneData } from '../interfaces/SceneData'
import { SceneDataComponent } from '../interfaces/SceneDataComponent'
import { addObject3DComponent } from '../behaviors/addObject3DComponent'
import { createGame, createGameObject } from '../behaviors/createGame'
import { LightTagComponent, VisibleTagComponent } from '../components/Object3DTagComponents'
import { AssetLoader } from '../../assets/classes/AssetLoader'
import { removeCollidersFromModel } from '../../physics/behaviors/parseModelColliders'
import { createVehicleFromSceneData } from '../../vehicle/prefabs/NetworkVehicle'
import { createParticleEmitterObject } from '../../particles/functions/particleHelpers'
import { createSkybox } from '../behaviors/createSkybox'
import { createBoxCollider } from '../behaviors/createBoxCollider'
import { createMeshCollider } from '../behaviors/createMeshCollider'
import { createCommonInteractive } from '../behaviors/createCommonInteractive'
import { createGroup } from '../behaviors/createGroup'
import { createLink } from '../behaviors/createLink'
import { createAudio, createMediaServer, createVideo, createVolumetric } from '../behaviors/createMedia'
import { createMap } from '../behaviors/createMap'
import { createShadow } from '../behaviors/createShadow'
import { createTransformComponent } from '../behaviors/createTransformComponent'
import { createTriggerVolume } from '../behaviors/createTriggerVolume'
import { handleAudioSettings } from '../behaviors/handleAudioSettings'
import { setFog } from '../behaviors/setFog'
import ScenePreviewCameraTagComponent from '../components/ScenePreviewCamera'
import SpawnPointComponent from '../components/SpawnPointComponent'
import WalkableTagComponent from '../components/Walkable'
import Image from '../classes/Image'
import { setPostProcessing } from '../behaviors/setPostProcessing'
import { CameraSystem } from '../../camera/systems/CameraSystem'
import { CopyTransformComponent } from '../../transform/components/CopyTransformComponent'
import { setEnvMap } from '../behaviors/setEnvMap'
import { PersistTagComponent } from '../components/PersistTagComponent'
import { createPortal } from '../behaviors/createPortal'
import { createGround } from '../behaviors/createGround'
import { configureCSM, handleRendererSettings } from '../behaviors/handleRendererSettings'
import { WebGLRendererSystem } from '../../renderer/WebGLRendererSystem'
import { Object3DComponent } from '../components/Object3DComponent'
import { AnimationComponent } from '../../character/components/AnimationComponent'
import { AnimationState } from '../../character/animations/AnimationState'
import { delay } from '../../ecs/functions/EngineFunctions'
import { setSkyDirection } from './setSkyDirection'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { AnimationManager } from '../../character/AnimationManager'

export enum SCENE_ASSET_TYPES {
  ENVMAP
}

type ScenePropertyType = {
  directionalLights: DirectionalLight[]
  isCSMEnabled: boolean
}
export class WorldScene {
  loadedModels = 0
  loaders: Promise<void>[] = []
  static callbacks: any
  static isLoading = false

  constructor(private onCompleted?: Function, private onProgress?: Function) {}

  loadScene = (scene: SceneData) => {
    WorldScene.callbacks = {}
    WorldScene.isLoading = true

    // reset renderer settings for if we are teleporting and the new scene does not have an override
    handleRendererSettings(null, true)
    configureCSM(null, true)

    const sceneProperty: ScenePropertyType = {
      directionalLights: []
    } as ScenePropertyType

    Object.keys(scene.entities).forEach((key) => {
      const sceneEntity = scene.entities[key]
      const entity = createEntity()
      entity.name = sceneEntity.name

      sceneEntity.components.forEach((component) => {
        component.data.sceneEntityId = sceneEntity.entityId
        this.loadComponent(entity, component, sceneProperty)
      })
    })

    Promise.all(this.loaders)
      .then(() => {
        WorldScene.isLoading = false
        Engine.sceneLoaded = true
        configureCSM(sceneProperty.directionalLights)
        EngineEvents.instance.dispatchEvent({ type: EngineEvents.EVENTS.SCENE_LOADED })

        this.onCompleted()
      })
      .catch((err) => {
        console.error('Error while loading the scene entities =>', err)
      })
  }

  _onModelLoaded = () => {
    this.loadedModels++
    if (typeof this.onProgress === 'function') this.onProgress(this.loaders.length - this.loadedModels)
  }

  static pushAssetTypeLoadCallback = (assetType: SCENE_ASSET_TYPES, callback: () => void): void => {
    if (!WorldScene.callbacks[assetType]) WorldScene.callbacks[assetType] = []
    WorldScene.callbacks[assetType].push(callback)
  }

  static executeAssetTypeLoadCallback = (assetType: SCENE_ASSET_TYPES, ...args: any[]): void => {
    WorldScene.callbacks[assetType]?.forEach((cb) => {
      cb(...args)
    })
  }

  loadComponent = (entity: Entity, component: SceneDataComponent, sceneProperty: ScenePropertyType): void => {
    // remove '-1', '-2' etc suffixes
    const name = component.name.replace(/(-\d+)|(\s)/g, '')

    switch (name) {
      case 'game':
        createGame(entity, component.data)
        break

      case 'game-object':
        createGameObject(entity, component.data)
        break

      case 'ambient-light':
        addObject3DComponent(entity, { obj3d: AmbientLight, objArgs: component.data })
        addComponent(entity, LightTagComponent)
        break

      case 'directional-light':
        if (isClient && WebGLRendererSystem.instance.csm) {
          // console.warn('SCENE LOADING - Custom directional lights are not supported when CSM is enabled.');
          const direction = new Vector3(0, 0, 1).applyQuaternion(getComponent(entity, TransformComponent).rotation)
          setSkyDirection(direction)
          return
        }
        addObject3DComponent(entity, {
          obj3d: DirectionalLight,
          objArgs: {
            'shadow.mapSize': component.data.shadowMapResolution,
            'shadow.bias': component.data.shadowBias,
            'shadow.radius': component.data.shadowRadius,
            intensity: component.data.intensity,
            color: component.data.color,
            castShadow: true
          }
        })
        addComponent(entity, LightTagComponent)

        sceneProperty.directionalLights.push(getComponent(entity, Object3DComponent).value as DirectionalLight)
        break

      case 'hemisphere-light':
        addObject3DComponent(entity, { obj3d: HemisphereLight, objArgs: component.data })
        break

      case 'point-light':
        addObject3DComponent(entity, { obj3d: PointLight, objArgs: component.data })
        break

      case 'collidable':
        // console.warn("'Collidable' is not implemented");
        break

      case 'floor-plan':
        break

      case 'simple-materials':
        Engine.simpleMaterials = component.data.simpleMaterials
        break

      case 'gltf-model':
        if (isClient) {
          this.loaders.push(
            new Promise<void>((resolve) => {
              AssetLoader.load(
                {
                  url: component.data.src,
                  entity
                },
                (res) => {
                  removeCollidersFromModel(entity, res)

                  // if the model has animations, we may have custom logic to initiate it. editor animations are loaded from `loop-animation` below
                  if (res.animations) {
                    // We only have to update the mixer time for this animations on each frame
                    addComponent(entity, AnimationComponent, { onlyUpdateMixerTime: true })
                    const animationComponent = getMutableComponent(entity, AnimationComponent)
                    animationComponent.animations = res.animations
                    const object3d = getMutableComponent(entity, Object3DComponent)

                    animationComponent.mixer = new AnimationMixer(object3d.value)
                    animationComponent.currentState = new AnimationState()
                  }

                  if (component.data.textureOverride) {
                    // we should push this to ECS, something like a SceneObjectLoadComponent,
                    // or add engine events for specific objects being added to the scene,
                    // the scene load event + delay 1 second delay works for now.
                    EngineEvents.instance.once(EngineEvents.EVENTS.SCENE_LOADED, async () => {
                      await delay(1000)
                      const objToCopy = Engine.scene.children.find((obj: any) => {
                        return obj.sceneEntityId === component.data.textureOverride
                      })
                      if (objToCopy)
                        objToCopy.traverse((videoMesh: any) => {
                          if (videoMesh.name === 'VideoMesh') {
                            getComponent(entity, Object3DComponent)?.value?.traverse((obj: any) => {
                              if (obj.material) {
                                obj.material = videoMesh.material
                              }
                            })
                          }
                        })
                    })
                  }
                  this._onModelLoaded()
                  resolve()
                },
                null,
                (err) => {
                  this._onModelLoaded()
                  resolve()
                }
              )
            })
          )
        }
        break

      case 'loop-animation':
        if (isClient) {
          EngineEvents.instance.once(EngineEvents.EVENTS.SCENE_LOADED, async () => {
            // We only have to update the mixer time for this animations on each frame
            const object3d = getMutableComponent(entity, Object3DComponent)
            if (!object3d) {
              console.warn(
                'Tried to load animation without an Object3D Component attached! Are you sure the model has loaded?'
              )
            }
            addComponent(entity, AnimationComponent, { onlyUpdateMixerTime: true })
            const animationComponent = getMutableComponent(entity, AnimationComponent)
            if (component.data.hasAvatarAnimations) {
              animationComponent.animations = AnimationManager.instance._animations
            } else {
              animationComponent.animations = object3d.value.animations
            }
            animationComponent.mixer = new AnimationMixer(object3d.value)
            animationComponent.currentState = new AnimationState()
            if (component.data.activeClipIndex >= 0) {
              const clip = animationComponent.animations[component.data.activeClipIndex]
              const action = animationComponent.mixer.clipAction(
                AnimationClip.findByName(animationComponent.animations, clip.name)
              )
              action.setEffectiveWeight(1)
              animationComponent.currentState.animations = [
                {
                  name: clip.name,
                  weight: 1,
                  loopType: LoopRepeat,
                  action
                }
              ]
              animationComponent.currentState.animations[0].action.play()
            }
          })
        }
        break

      case 'interact':
        createCommonInteractive(entity, component.data)
        break

      case 'ground-plane':
        createGround(entity, component.data)
        break

      case 'image':
        addObject3DComponent(entity, { obj3d: Image, objArgs: component.data })
        break

      case 'video':
        // if livestream, server will send the video info to the client
        if (isClient) {
          // if(!component.data.isLivestream) {
          createVideo(entity, component.data)
          // }
          // addComponent(entity, LivestreamComponent)
          // } else if(component.data.isLivestream) {
          // @todo
          // addComponent(entity, LivestreamProxyComponent, { src: component.data.src })
        } else {
          createMediaServer(entity, component.data)
        }
        break

      case 'map':
        if (isClient) createMap(entity, component.data)
        break

      case 'audio':
        if (isClient) createAudio(entity, component.data)
        else createMediaServer(entity, component.data)
        break

      case 'volumetric':
        if (isClient) createVolumetric(entity, component.data)
        else createMediaServer(entity, component.data)
        break

      case 'spot-light':
        addObject3DComponent(entity, { obj3d: SpotLight, objArgs: component.data })
        break

      case 'transform':
        createTransformComponent(entity, component.data)
        break

      case 'visible':
        addComponent(entity, VisibleTagComponent)
        break

      case 'walkable':
        addComponent(entity, WalkableTagComponent)
        break

      case 'fog':
        setFog(entity, component.data)
        break

      case 'skybox':
        createSkybox(entity, component.data as any)
        break

      case 'audio-settings':
        handleAudioSettings(entity, component.data)
        break

      case 'renderer-settings':
        handleRendererSettings(component.data)
        sceneProperty.isCSMEnabled = component.data.csm
        break

      case 'spawn-point':
        addComponent(entity, SpawnPointComponent)
        break

      case 'scene-preview-camera':
        addComponent(entity, ScenePreviewCameraTagComponent)
        if (isClient && CameraSystem.instance.activeCamera) {
          addComponent(CameraSystem.instance.activeCamera, CopyTransformComponent, { input: entity })
        }
        break

      case 'shadow':
        createShadow(entity, {
          castShadow: component.data.cast,
          receiveShadow: component.data.receive
        })
        break

      case 'group':
        createGroup(entity, component.data)
        break

      case 'box-collider':
        createBoxCollider(entity, component.data)
        break

      case 'mesh-collider':
        createMeshCollider(entity, component.data)
        break

      case 'vehicle-saved-in-scene':
        createVehicleFromSceneData(entity, component.data)
        break

      case 'trigger-volume':
        createTriggerVolume(entity, component.data)
        break

      case 'link':
        createLink(entity, component.data)
        break

      case 'particle-emitter':
        createParticleEmitterObject(entity, component.data)
        break

      case 'postprocessing':
        setPostProcessing(entity, component.data)
        break

      case 'envmap':
        setEnvMap(entity, component.data)
        break

      case 'persist':
        if (isClient) addComponent(entity, PersistTagComponent)
        break

      case 'portal':
        createPortal(entity, component.data)
        break

      default:
        return console.warn("Couldn't load Component", name)
    }
  }

  static load = (scene: SceneData, onCompleted: Function, onProgress?: Function) => {
    const world = new WorldScene(onCompleted, onProgress)
    world.loadScene(scene)
  }
}
