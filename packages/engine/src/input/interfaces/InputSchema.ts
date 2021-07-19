import { NumericalType } from '../../common/types/NumericalTypes'
import { Entity } from '../../ecs/classes/Entity'
import { InputAlias } from '../types/InputAlias'
import { InputValue } from './InputValue'

export type InputBehaviorType = (
  entity: Entity,
  inputKey: InputAlias,
  inputValue: InputValue<NumericalType>,
  delta: number
) => void

export interface InputSchema {
  onAdded: (entity: Entity, delta: number) => void
  onRemove: (entity: Entity, delta: number) => void
  inputMap: Map<InputAlias, InputAlias>
  behaviorMap: Map<InputAlias, InputBehaviorType>
}
