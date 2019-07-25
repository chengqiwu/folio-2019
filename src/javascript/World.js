import * as THREE from 'three'
import FloorMaterial from './Materials/Floor.js'
import MatcapMaterial from './Materials/Matcap.js'
import Physics from './Physics.js'

export default class
{
    constructor(_options)
    {
        // Options
        this.debug = _options.debug
        this.resources = _options.resources
        this.time = _options.time

        // Set up
        if(this.debug)
        {
            this.debugFolder = this.debug.addFolder('world')
            // this.debugFolder.open()
        }

        this.container = new THREE.Object3D()
        this.objects = []

        this.setMaterials()
        this.setPhysics()
        // this.setFloor()
    }

    setMaterials()
    {
        this.materials = {}

        // Debug
        if(this.debug)
        {
            this.materials.debugFolder = this.debugFolder.addFolder('materials')
            this.materials.debugFolder.open()
        }

        /**
         * Matcaps
         */
        this.materials.matcaps = {}
        this.materials.matcaps.indirectColor = '#d04500'
        this.materials.matcaps.uniforms = {
            uIndirectDistanceAmplitude: 1,
            uIndirectDistanceStrength: 0.7,
            uIndirectDistancePower: 2.0,
            uIndirectAngleStrength: 1.5,
            uIndirectAngleOffset: 0.6,
            uIndirectAnglePower: 1.0,
            uIndirectColor: null
        }

        this.materials.matcaps.rock = new MatcapMaterial()
        this.materials.matcaps.rock.uniforms.matcap.value = this.resources.items.matcapRockTexture

        this.materials.matcaps.building = new MatcapMaterial()
        this.materials.matcaps.building.uniforms.matcap.value = this.resources.items.matcapBuildingTexture

        this.materials.matcaps.updateUniforms = () =>
        {
            this.materials.matcaps.uniforms.uIndirectColor = new THREE.Color(this.materials.matcaps.indirectColor)
            for(const _uniformName in this.materials.matcaps.uniforms)
            {
                const _uniformValue = this.materials.matcaps.uniforms[_uniformName]
                this.materials.matcaps.rock.uniforms[_uniformName].value = _uniformValue
                this.materials.matcaps.building.uniforms[_uniformName].value = _uniformValue
            }
        }

        this.materials.matcaps.updateUniforms()

        // Debug
        if(this.debug)
        {
            const folder = this.materials.debugFolder.addFolder('matcaps')
            folder.open()

            folder.add(this.materials.matcaps.uniforms, 'uIndirectDistanceAmplitude').step(0.001).min(0).max(0.5).onChange(this.materials.matcaps.updateUniforms)
            folder.add(this.materials.matcaps.uniforms, 'uIndirectDistanceStrength').step(0.001).min(0).max(2).onChange(this.materials.matcaps.updateUniforms)
            folder.add(this.materials.matcaps.uniforms, 'uIndirectDistancePower').step(0.001).min(0).max(5).onChange(this.materials.matcaps.updateUniforms)
            folder.add(this.materials.matcaps.uniforms, 'uIndirectAngleStrength').step(0.001).min(0).max(2).onChange(this.materials.matcaps.updateUniforms)
            folder.add(this.materials.matcaps.uniforms, 'uIndirectAngleOffset').step(0.001).min(- 2).max(2).onChange(this.materials.matcaps.updateUniforms)
            folder.add(this.materials.matcaps.uniforms, 'uIndirectAnglePower').step(0.001).min(0).max(5).onChange(this.materials.matcaps.updateUniforms)
            folder.addColor(this.materials.matcaps, 'indirectColor').onChange(this.materials.matcaps.updateUniforms)
        }

        /**
         * Floor
         */
        this.materials.floor = new FloorMaterial()

        this.materials.floor.shadowColor = '#d04500'

        this.materials.floor.colors = {}
        this.materials.floor.colors.topLeft = '#d98441'
        this.materials.floor.colors.topRight = '#eba962'
        this.materials.floor.colors.bottomRight = '#f3c17d'
        this.materials.floor.colors.bottomLeft = '#eaa860'

        this.materials.floor.updateUniforms = () =>
        {
            const topLeft = new THREE.Color(this.materials.floor.colors.topLeft)
            const topRight = new THREE.Color(this.materials.floor.colors.topRight)
            const bottomRight = new THREE.Color(this.materials.floor.colors.bottomRight)
            const bottomLeft = new THREE.Color(this.materials.floor.colors.bottomLeft)

            const data = new Uint8Array([
                Math.round(bottomLeft.r * 255), Math.round(bottomLeft.g * 255), Math.round(bottomLeft.b * 255),
                Math.round(bottomRight.r * 255), Math.round(bottomRight.g * 255), Math.round(bottomRight.b * 255),
                Math.round(topLeft.r * 255), Math.round(topLeft.g * 255), Math.round(topLeft.b * 255),
                Math.round(topRight.r * 255), Math.round(topRight.g * 255), Math.round(topRight.b * 255)
            ])

            this.materials.floor.backgroundTexture = new THREE.DataTexture(data, 2, 2, THREE.RGBFormat)
            this.materials.floor.backgroundTexture.magFilter = THREE.LinearFilter
            this.materials.floor.backgroundTexture.needsUpdate = true

            this.materials.floor.uniforms.tBackground.value = this.materials.floor.backgroundTexture

            this.materials.floor.uniforms.tShadow.value = this.resources.items.floorShadowTexture
            this.materials.floor.uniforms.uShadowColor.value = new THREE.Color(this.materials.floor.shadowColor)
        }

        this.materials.floor.updateUniforms()

        // Debug
        if(this.debug)
        {
            const folder = this.materials.debugFolder.addFolder('floor')
            folder.open()

            folder.addColor(this.materials.floor, 'shadowColor').onChange(this.materials.floor.updateUniforms)
            folder.addColor(this.materials.floor.colors, 'topLeft').onChange(this.materials.floor.updateUniforms)
            folder.addColor(this.materials.floor.colors, 'topRight').onChange(this.materials.floor.updateUniforms)
            folder.addColor(this.materials.floor.colors, 'bottomRight').onChange(this.materials.floor.updateUniforms)
            folder.addColor(this.materials.floor.colors, 'bottomLeft').onChange(this.materials.floor.updateUniforms)
        }
    }

    setFloor()
    {
        this.floor = {}
        this.floor.geometry = new THREE.PlaneBufferGeometry(10.84 * 2, 10.84 * 2, 10, 10)
        this.floor.mesh = new THREE.Mesh(this.floor.geometry, this.materials.floor)
        this.floor.mesh.rotation.x = - Math.PI * 0.5
        this.container.add(this.floor.mesh)
    }

    setPhysics()
    {
        this.physics = new Physics({
            debug: this.debug,
            time: this.time
        })

        const sphere = {}
        sphere.geometry = new THREE.SphereBufferGeometry(1, 32, 32)
        sphere.mesh = new THREE.Mesh(sphere.geometry, this.materials.matcaps.rock)
        this.container.add(sphere.mesh)

        this.time.on('tick', () =>
        {
            sphere.mesh.position.x = this.physics.dummy.sphere.position.x
            sphere.mesh.position.y = this.physics.dummy.sphere.position.z
            sphere.mesh.position.z = this.physics.dummy.sphere.position.y
        })
    }

    addObject(_objectOptions)
    {
        const object = {}
        object.type = _objectOptions.type

        // Static object
        if(object.type === 'static')
        {
            // Container
            object.container = new THREE.Object3D()
            this.container.add(object.container)

            // Go through each base child
            const baseChildren = [..._objectOptions.base.children]
            for(let i = 0; i < baseChildren.length; i++)
            {
                let mesh = baseChildren[i]

                // Building
                if(mesh.name.match(/^building[0-9]{0,3}?$/i))
                {
                    mesh.material = this.materials.matcaps.building
                }

                // Rock
                else if(mesh.name.match(/^rock[0-9]{0,3}?$/i))
                {
                    mesh.material = this.materials.matcaps.rock
                }

                // Floor
                else if(mesh.name.match(/^floor[0-9]{0,3}?$/i))
                {
                    const geometry = new THREE.PlaneBufferGeometry(mesh.scale.x * 2, mesh.scale.z * 2, 10, 10)
                    const material = this.materials.floor.clone()

                    material.uniforms.tBackground.value = this.materials.floor.backgroundTexture
                    material.uniforms.tShadow.value = _objectOptions.floorShadowTexture
                    material.uniforms.uShadowColor.value = new THREE.Color(this.materials.floor.shadowColor)

                    mesh = new THREE.Mesh(geometry, material)
                    mesh.rotation.x = - Math.PI * 0.5
                }

                // Not found
                else
                {
                    mesh.material = new THREE.MeshNormalMaterial()
                }

                // Add to container
                object.container.add(mesh)
            }

            // Go through each collision children
            const collisionChildren = [..._objectOptions.collision.children]
            for(let i = 0; i < collisionChildren.length; i++)
            {
                const mesh = collisionChildren[i]

                if(mesh.name.match(/^cube[0-9]{0,3}?|box[0-9]{0,3}?$/i))
                {
                    const collision = this.physics.addObject({
                        type: 'static',
                        position: mesh.position,
                        rotation: mesh.rotation,
                        shape: 'box',
                        halfExtents: { x: mesh.scale.x * 0.5, y: mesh.scale.y * 0.5, z: mesh.scale.z * 0.5 }
                    })

                    object.collision = collision
                }
            }

            // Save
            this.objects.push(object)
        }
    }
}