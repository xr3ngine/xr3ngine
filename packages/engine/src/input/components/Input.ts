import { NumericalType } from '../../common/types/NumericalTypes'
import { Component } from '../../ecs/classes/Component'
import { Types } from '../../ecs/types/Types'
import { InputSchema } from '../interfaces/InputSchema'
import { InputValue } from '../interfaces/InputValue'
import { InputAlias } from '../types/InputAlias'

export class Input extends Component<Input> {
  prevData: Map<InputAlias, InputValue<NumericalType>> = new Map<InputAlias, InputValue<NumericalType>>()
  data: Map<InputAlias, InputValue<NumericalType>> = new Map<InputAlias, InputValue<NumericalType>>()
  schema: InputSchema

  static _schema = {
    schema: { type: Types.Ref, default: null }
  }
}
