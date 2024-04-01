const color = require('picocolors')
const { globSync } = require('glob')
const path = require('path')
const fs = require('fs')
const { URL } = require('node:url')
const COS = require('cos-nodejs-sdk-v5')
const { normalizePath } = require('vite')
const { to } = require('await-to-js')

module.exports = function vitePluginTencentOss(options) {
  let baseConfig = '/'
  let buildConfig = ''

  if (options.enabled !== void 0 && !options.enabled) {
    return
  }

  return {
    name: 'vite-plugin-tencent-oss',
    enforce: 'post',
    apply: 'build',
    configResolved(config) {
      baseConfig = config.base
      buildConfig = config.build
    },
    async closeBundle() {
      let {secretId:SecretId,secretKey:SecretKey,bucket:Bucket,region:Region,overwrite=false,test=false, from='dist', base=''}=options
      if(!SecretId || !SecretKey || !Bucket || !Region){
        throw new Error('关键参数缺失')
      }
      const outDirPath = normalizePath(path.resolve(normalizePath(from)))
      const {pathname: ossBasePath, origin: ossOrigin} = new URL(base)

      delete options.secretId
      delete options.secretKey
      delete options.overwrite
      delete options.test

      const client = new COS({
        ...options,
        SecretId,
        SecretKey,
      })
      const ssrClient = buildConfig.ssrManifest
      const ssrServer = buildConfig.ssr
      // custom ignore
      const ignore = options.ignore !== void 0 ? options.ignore :
        // ssr client ignore
        ssrClient ? ['**/ssr-manifest.json', '**/*.html'] :
        // ssr server ignore
        ssrServer ? ['**'] :
        // default ignore
        '**/*.html'
      console.log('ignore',ignore)
      const files = await globSync(
        outDirPath + '/**/*',
        {
          strict: true,
          nodir: true,
          dot: true,
          ignore
        }
      )


      console.time("tencent oss upload complete ^_^, cost");

      let promiseArr = []

      for (const fileFullPath of files) {
        const filePath = fileFullPath.split(outDirPath)[1] // eg: '/assets/vendor.bfb92b77.js'

        const ossFilePath = ossBasePath.replace(/\/$/, '') + filePath // eg: '/base/assets/vendor.bfb92b77.js'

        const completePath = ossOrigin + ossFilePath // eg: 'https://foo.com/base/assets/vendor.bfb92b77.js'

        const output = `${buildConfig.outDir + filePath} => ${color.green(completePath)}`

        if (test) {
          console.log(`test upload path: ${output}`)
          continue
        }
        promiseArr.push(
          new Promise(async(resolve, reject) => {
            if (overwrite) {
              const [err, data] = await to(upDown(client,{Bucket,Region,ossFilePath,fileFullPath}))
              data && resolve({type: 'success'})
              err && reject(err)
            } else {
              //不覆盖的话，先校验下文件是否存在
              const [err, data] = await to(client.headObject({
                Bucket,
                Region,
                Key: ossFilePath,
              }));
              data && resolve({type: 'notCover'})
              if (err) {
                if(err.code === '404'){
                  const [err, data] = await to(upDown(client,{Bucket,Region,ossFilePath,fileFullPath}))
                  data && resolve({type: 'success'})
                  err && reject(err)
                }else{
                  reject(err)
                }
              }
            }
          })
        )
      }
  
      let [err, data] = await to(Promise.all(promiseArr));
      console.timeEnd("tencent oss upload complete ^_^, cost");

      if (err) {
        console.log('上传失败', err)
        return
      }
      let writeNum = 0, notCoverNum = 0
      if (data && data.length > 0) {
        data.forEach(item => {
          if (item.type === 'success') {
            writeNum++
          }
          if (item.type === 'notCover') {
            notCoverNum++
          }
        })
      }
      if (overwrite) {
        console.log(`上传文件共${data.length}个，成功${writeNum}个`)
      } else {
        console.log(`上传文件共${data.length}个，成功${writeNum}个,存在相同未覆盖文件${notCoverNum}个`)
      }
    }
  }
}


function upDown(client,option) {
  let {Bucket,Region,ossFilePath:Key,fileFullPath}=option
  return client.putObject(
    {
      Bucket,
      Region,
      Key,
      Body: fs.createReadStream(fileFullPath)
    }
  )
}

// export default { vitePluginTencentOss, TencentConfig }
// module.exports = { vitePluginTencentOss, TencentConfig }
