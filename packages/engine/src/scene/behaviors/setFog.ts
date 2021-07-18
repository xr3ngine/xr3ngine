import { Fog, FogExp2 } from 'three'
import { Behavior } from '../../common/interfaces/Behavior'
import { Engine } from '../../ecs/classes/Engine'
import { addComponent } from '../../ecs/functions/EntityFunctions'
import { FogComponent } from '../components/FogComponent'
import { FogType } from '../constants/FogType'

export const setFog = (entity, args: { type: string; color: string; density: number; near: number; far: number }) => {
  if (args.type === FogType.Disabled) {
    return
  }

  let fog
  if (args.type === FogType.Linear) fog = new Fog(args.color, args.near, args.far)
  else if (args.type === FogType.Exponential) {
    fog = new FogExp2(args.color, args.density)
  }
  // else return console.warn("Fog is disabled");

  addComponent(entity, FogComponent, {
    type: args.type,
    color: args.color,
    density: args.density,
    near: args.near,
    far: args.far
  })

  Engine.scene.fog = fog
}
