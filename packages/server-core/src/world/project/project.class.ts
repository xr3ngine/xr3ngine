import { Params, Id, NullableId, ServiceMethods } from '@feathersjs/feathers'
import { Transaction } from 'sequelize/types'
import fetch from 'node-fetch'

import {
  mapProjectDetailData,
  defaultProjectImport,
  readJSONFromBlobStore,
  mapProjectTemplateDetailData
} from './project-helper'
import { extractLoggedInUserFromParams } from '../../user/auth-management/auth-management.utils'
import { Application } from '../../../declarations'
import StorageProvider from '../../media/storageprovider/storageprovider'
import { BadRequest } from '@feathersjs/errors'
import logger from '../../logger'
import { Op } from 'sequelize'
import config from '../../appconfig'
import { contents } from '@xrengine/common/src/scenes-templates'
interface Data {}
interface ServiceOptions {}

export class Project implements ServiceMethods<Data> {
  app: Application
  options: ServiceOptions
  models: any
  docs: any

  constructor(options: ServiceOptions = {}, app: Application) {
    this.options = options
    this.app = app
    this.models = this.app.get('sequelizeClient').models
  }

  async setup() {}

  /**
   * A function which is used to display all projects
   *
   * @param params contains current user
   * @returns {@Object} contains all project
   * @author Vyacheslav Solovjov
   */
  async find(params: Params): Promise<any> {
    const loggedInUser = extractLoggedInUserFromParams(params)
    const projects = await this.models.collection.findAll({
      where: {
        [Op.or]: [{ userId: loggedInUser.userId }, { userId: null }]
      },
      attributes: ['name', 'id', 'sid', 'url'],
      include: defaultProjectImport(this.app.get('sequelizeClient').models)
    })
    const processedProjects = projects.map((project: any) => mapProjectDetailData(project.toJSON()))
    return { projects: processedProjects }
  }

  /**
   * A function which is used to find specific project
   *
   * @param id of single project
   * @param params contains current user
   * @returns {@Object} contains specific project
   * @author Vyacheslav Solovjov
   */
  async get(id: Id, params: Params): Promise<any> {
    const loggedInUser = extractLoggedInUserFromParams(params)

    let project
    if (String(id).match(/^~/)) {
      project = contents.find((project) => project.id === id)
      if (!project) {
        return Promise.reject(new BadRequest('Project template not found'))
      }
      return mapProjectTemplateDetailData(project)
    } else {
      project = await this.models.collection.findOne({
        attributes: ['name', 'id', 'sid', 'url', 'type'],
        where: {
          sid: id
          // userId: loggedInUser.userId
        },
        include: defaultProjectImport(this.app.get('sequelizeClient').models)
      })
    }

    if (!project) {
      return Promise.reject(new BadRequest("Project not found Or you don't have access!"))
    }

    return mapProjectDetailData(project.toJSON())
  }

  /**
   * A function which is used to create new project
   *
   * @param data used to create new project
   * @param params contains user info
   * @returns {@Object} of created new project
   * @author Vyacheslav Solovjov
   */
  async create(data: any, params: Params): Promise<any> {
    const provider = new StorageProvider()
    const storage = provider.getStorage()

    // After saving project, remove the project json file from s3, as we have saved that on database in collection table
    const tempOwnedFileKey = params.ownedFile.key
    storage.remove(
      {
        key: tempOwnedFileKey
      },
      (err: any, result: any) => {
        if (err) {
          logger.error('Storage removal error')
          logger.error('Error in removing project temp Owned file: ', err)
        }
        logger.info('Project temp Owned file removed result: ', result)
      }
    )
    return mapProjectDetailData(params.collection)
  }

  /**
   * A function which is used to update new project
   *
   * @param id
   * @param data of new project
   * @param params
   * @returns {@Object} of updated project
   * @author Vyacheslav Solovjov
   */
  async update(id: NullableId, data: Data, params?: Params): Promise<Data> {
    return data
  }

  async patch(projectId: NullableId, data: any, params: Params): Promise<any> {
    const loggedInUser = extractLoggedInUserFromParams(params)
    const seqeulizeClient = this.app.get('sequelizeClient')
    const models = seqeulizeClient.models
    const CollectionModel = models.collection
    const EntityModel = models.entity
    const StaticResourceModel = models.static_resource
    const ComponentModel = models.component
    const ComponentTypeModel = models.component_type
    const provider = new StorageProvider()
    const storage = provider.getStorage()

    const project = await CollectionModel.findOne({
      where: {
        sid: projectId
        // userId: loggedInUser.userId
      }
    })

    if (!project) {
      return await Promise.reject(new BadRequest("Project not found Or you don't have access!"))
    }

    // Find the project owned_file from database
    // TODO: Create a hook for create and patch methods to avoid code duplication.
    const ownedFile = await StaticResourceModel.findOne({
      where: {
        id: data.ownedFileId
      },
      raw: true
    })

    if (!ownedFile) {
      return await Promise.reject(new BadRequest('Project File not found!'))
    }
    let sceneData
    if (config.server.storageProvider === 'aws') {
      sceneData = await fetch(ownedFile.url).then((res) => res.json())
    } else {
      sceneData = await readJSONFromBlobStore(storage, ownedFile.key)
    }
    if (!sceneData) return
    await seqeulizeClient.transaction(async (transaction: Transaction) => {
      project.update(
        {
          name: data.name,
          metadata: sceneData.metadata,
          version: sceneData.version
        },
        { fields: ['name', 'metadata', 'version'], transaction }
      )

      // First delete existing collection, entity and components and create new ones
      // Delete all entities belongs to collection, as we have added constraint that on entity remove, remove all their components too
      await EntityModel.destroy({
        where: {
          collectionId: project.id
        },
        transaction
      })

      const sceneEntitiesArray: any = []

      for (const prop in sceneData.entities) {
        sceneEntitiesArray.push({ entityId: prop, ...sceneData.entities[prop] })
      }

      const entites = sceneEntitiesArray.map((entity: any) => {
        entity.name = entity.name.toLowerCase()
        entity.collectionId = project.id
        return entity
      })
      const savedEntities = await EntityModel.bulkCreate(entites, { transaction })
      const components: any = []
      const componetTypeSet = new Set()
      savedEntities.forEach((savedEntity: any, index: number) => {
        const entity = sceneEntitiesArray[index]
        entity.components.forEach((component: any) => {
          componetTypeSet.add(component.name.toLowerCase())
          components.push({
            data: component.props,
            entityId: savedEntity.id,
            type: component.name.toLowerCase(),
            userId: loggedInUser.userId,
            collection: project.id
          })
        })
      })
      // Now we check if any of component-type is missing, then create that one
      let savedComponentTypes = await ComponentTypeModel.findAll({
        where: {
          type: Array.from(componetTypeSet)
        },
        raw: true,
        attributes: ['type']
      })

      savedComponentTypes = savedComponentTypes.map((item: any) => item.type)
      if (savedComponentTypes.length <= componetTypeSet.size) {
        let nonExistedComponentTypes = Array.from(componetTypeSet).filter(
          (item) => savedComponentTypes.indexOf(item) < 0
        )

        nonExistedComponentTypes = nonExistedComponentTypes.map((item) => {
          return {
            type: item
          }
        })
        await ComponentTypeModel.bulkCreate(nonExistedComponentTypes, { transaction })
      }
      await ComponentModel.bulkCreate(components, { transaction })

      // After saving project, remove the project json file from s3/local, as we have saved that on database in collection table
      const tempOwnedFileKey = ownedFile.key
      storage.remove(
        {
          key: tempOwnedFileKey
        },
        (err: any, result: any) => {
          if (err) {
            console.log('Storage removal error')
            console.log('Error in removing project temp Owned file: ', err)
          }
          console.log('Project temp Owned file removed result: ', result)
        }
      )

      // Remove the static-resource because entities and components have been extracted from that resource
      await StaticResourceModel.destroy(
        {
          where: {
            id: ownedFile.id
          }
        },
        { transaction }
      )
    })

    const savedProject = await this.reloadProject(project.id, project)
    return mapProjectDetailData(savedProject.toJSON())
  }
  /**
   * A function which is used to remove specific project
   *
   * @param id of specific project
   * @param params
   * @returns {@Object} of updated project
   */
  async remove(id: NullableId, params?: Params): Promise<Data> {
    if (!id) return { id }

    const { collection } = this.models
    await collection.destroy({
      where: {
        sid: id
      }
    })
    return {
      id
    }
  }

  /**
   * A function which is used to reload project
   *
   * @param projectId of specific project
   * @param loadedProject data of loaded project
   * @returns {@Object} of loaded Project
   * @author Vyacheslav Solovjov
   */
  private async reloadProject(projectId: string, loadedProject?: any): Promise<any> {
    const seqeulizeClient = this.app.get('sequelizeClient')
    const models = seqeulizeClient.models
    const StaticResourceModel = models.static_resource
    const CollectionModel = (this.app.service('collection') as any).Model
    const projectIncludes: any = [
      {
        model: StaticResourceModel,
        /////////////
        as: 'thumbnail_owned_file',
        attributes: ['url']
      }
    ]

    if (loadedProject?.sceneId) {
      projectIncludes.push({
        model: CollectionModel,
        attributes: ['userId', 'description', 'name', 'parentSceneId', 'sceneId', 'sid']
      })
    }

    if (loadedProject?.parentSceneId) {
      projectIncludes.push({
        model: CollectionModel,
        attributes: ['userId', 'description', 'name', 'parentSceneId', 'sceneId', 'sid'],
        as: 'parent_scene'
      })
    }

    const projectData = await CollectionModel.findOne({
      where: {
        id: projectId
      },
      attributes: ['name', 'id', 'sid', 'url', 'ownedUploadedFileId'],
      include: projectIncludes
    })

    return projectData
  }
}
