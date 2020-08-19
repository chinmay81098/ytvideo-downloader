<template>
    <CContainer>
        <h2>Downloader</h2>
        <CToaster :autohide="3000">
          <template v-for="toast in fixedToasts">
            <CToast
              :key="'toast' + toast"
              :show="true"
              header = "Message"
            >{{message}}</CToast>
          </template>
        </CToaster>
        <CRow>
            <CCol sm="12">
                <CCard>
                    <CCardBody>
                        <CTextarea
                        required
                        label="Paste URL's Here"
                        :placeholder="inputFormat"
                        rows=10
                        v-model="urls"
                        />
                        <CInputCheckbox
                        label="Merge all after download"
                        :checked.sync="merge"
                        :disabled="onClickDownload"
                        />
                    </CCardBody>
                    <CCardFooter v-if="onDownload">
                         <CProgress
                            :value="precentage"
                            color="success"
                            animated
                            :precision="2"
                            :showPercentage="true"
                            show-value
                            style="height:20px;"
                            class="mt-1"
                            />
                    </CCardFooter>
                </CCard>
            </CCol>
            <CCol sm="6">
                <CButton color="primary" :disabled="onClickDownload" @click="handleDownload">
                    Download
                </CButton>
            </CCol>
            <!--CCol sm="6">
                <CButton color="primary" @click="handleMerge" :disabled="notDownloaded">
                    Merge
                </CButton>
            </CCol-->
        </CRow>
    </CContainer>
</template>

<script>
import {ipcRenderer} from 'electron';
export default {
    name:'videoDownload',
    data(){
        return{
            urls:'',
            merge:true,
            notDownloaded:true,
            message:'',
            fixedToasts:0,
            precentage:0,
            ratio:0,
            onDownload:false,
            onClickDownload:false,
            total:0,
            downloaded:0,
            inputFormat:'input format :[url 1,url 2,url 3] without square brackets'
        }
    },
    methods:{
        handleDownload(){
            var urlList = this.urls.split(',')
            var UniqueUrlList = urlList.filter((item,index)=>urlList.indexOf(item) === index)
            const re = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/;
            var filteredUrlList = UniqueUrlList.filter(url=>re.test(url))
            if (this.urls === ""){
                this.fixedToasts++;
                this.message = "URL field cannot be empty"
            }
            else if(!filteredUrlList.length){
                this.fixedToasts++
                this.message = "Invalid URL's"
            }
            else{
                this.onClickDownload = true;
                ipcRenderer.send('download-all',{urlList:filteredUrlList,merge:this.merge})
            }
        },
        /*handleMerge(){
            ipcRenderer.send('merge')
        },*/
        displayPercentage(bytes_downloaded,bytes_total){
            this.ratio = (this.downloaded+bytes_downloaded)/(this.total+bytes_total)
            this.precentage = Math.round(this.ratio*100,2);
            if(this.precentage === 100){
                this.downloaded+=bytes_downloaded
                this.total+=bytes_total
            }
        },
        callbackDownload(response){
            if(response.error!=true){
                if(response.downloaded){
                    this.onDownload = false;
                    this.precentage = 0;
                    this.total = 0;
                    this.downloaded = 0;
                }
            }
            else if(response.error && response.downloaded){
                this.onDownload = false;
                this.precentage = 0;
                this.total = 0;
                this.downloaded = 0;
            }
            this.fixedToasts++;
            this.message = response.msg;
            this.onClickDownload = false;
        }
    },
    mounted(){
        ipcRenderer.on('download-process',(e,response)=>{
           this.callbackDownload(response);
        })
        /*ipcRenderer.on('Merge-complete',(e,msg)=>{
            this.fixedToasts++;
            this.message = msg;
            this.onClickDownload = false;
        })*/
        ipcRenderer.once('downloading',()=>{
            this.onDownload = true;
        })
        ipcRenderer.on('downloading',(e,res)=>{
            this.displayPercentage(res[0],res[1]);
        })
        /*ipcRenderer.on('Error',(e,msg)=>{
            this.fixedToasts++;
            this.message = msg;
            this.onClickDownload = false;
        })*/
    }
}
</script>