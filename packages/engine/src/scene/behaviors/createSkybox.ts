import { Color, CubeTextureLoader, PMREMGenerator, sRGBEncoding, TextureLoader, Vector3 } from 'three'
import { isClient } from '../../common/functions/isClient'
import { Engine } from '../../ecs/classes/Engine'
import { addComponent, getComponent, getMutableComponent } from '../../ecs/functions/EntityFunctions'
import { SceneBackgroundProps, SkyTypeEnum } from '../../editor/nodes/SkyboxNode'
import { WebGLRendererSystem } from '../../renderer/WebGLRendererSystem'
import { ScaleComponent } from '../../transform/components/ScaleComponent'
import { Sky } from '../classes/Sky'
import { Object3DComponent } from '../components/Object3DComponent'
import { SCENE_ASSET_TYPES, WorldScene } from '../functions/SceneLoading'
import { setSkyDirection } from '../functions/setSkyDirection'
import { addObject3DComponent } from './addObject3DComponent'

export const createSkybox = (entity, args: SceneBackgroundProps) => {
  if (isClient) {
    const pmremGenerator = new PMREMGenerator(Engine.renderer)
    switch (args.backgroundType) {
      case SkyTypeEnum.skybox:
        const option = args.skyboxProps
        addObject3DComponent(entity, { obj3d: new Sky(), objArgs: { skyBoxShaderProps: option } })
        addComponent(entity, ScaleComponent)

        const component = getComponent(entity, Object3DComponent)
        const skyboxObject3D = component.value
        const scaleComponent = getMutableComponent<ScaleComponent>(entity, ScaleComponent)
        scaleComponent.scale = [option.distance, option.distance, option.distance]
        const uniforms = Sky.material.uniforms
        const sun = new Vector3()
        const theta = Math.PI * (option.inclination - 0.5)
        const phi = 2 * Math.PI * (option.azimuth - 0.5)

        sun.x = Math.cos(phi)
        sun.y = Math.sin(phi) * Math.sin(theta)
        sun.z = Math.sin(phi) * Math.cos(theta)
        uniforms.mieCoefficient.value = option.mieCoefficient
        uniforms.mieDirectionalG.value = option.mieDirectionalG
        uniforms.rayleigh.value = option.rayleigh
        uniforms.turbidity.value = option.turbidity
        uniforms.luminance.value = option.luminance
        uniforms.sunPosition.value = sun
        setSkyDirection(sun)

        const skyboxTexture = (skyboxObject3D as any).generateSkybox(Engine.renderer)

        Engine.scene.background = skyboxTexture
        break

      case SkyTypeEnum.cubemap:
        const negx = 'negx.jpg'
        const negy = 'negy.jpg'
        const negz = 'negz.jpg'
        const posx = 'posx.jpg'
        const posy = 'posy.jpg'
        const posz = 'posz.jpg'

        new CubeTextureLoader().setPath(args.cubemapPath).load(
          [posx, negx, posy, negy, posz, negz],
          (texture) => {
            texture.encoding = sRGBEncoding
            Engine.scene.background = texture
          },
          (res) => {
            console.log(res)
          },
          (erro) => {
            console.warn('Skybox texture could not be found!', erro)
          }
        )
        break

      case SkyTypeEnum.equirectangular:
        new TextureLoader().load(args.equirectangularPath, (texture) => {
          texture.encoding = sRGBEncoding
          Engine.scene.background = pmremGenerator.fromEquirectangular(texture).texture
        })
        break

      case SkyTypeEnum.color:
        Engine.scene.background = new Color(args.backgroundColor)
        break
    }
  }
}
