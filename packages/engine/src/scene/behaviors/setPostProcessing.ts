import { Behavior } from '../../common/interfaces/Behavior'
import { PostProcessingSchema } from '../../renderer/interfaces/PostProcessingSchema'
import { WebGLRendererSystem } from '../../renderer/WebGLRendererSystem'

export const setPostProcessing = (entity, args: { options: PostProcessingSchema }) => {
  WebGLRendererSystem.instance?.configurePostProcessing(args.options)
}
