package main

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/jinzhu/gorm"
)

// Task 任务
type Task struct {
	gorm.Model
	Name        string
	ChapterName string
	Link        string
	Finished    bool `gorm:"default:false"`
	Get         bool `gorm:"default:false"`
	GetTime     int64
}

func (task *Task) str() string {
	return fmt.Sprint("任务："+task.Name, " - ", task.ChapterName)
}

type addTaskParam struct {
	Name     string `binding:"required"`
	Chapters []struct {
		Name string `binding:"required"`
		Link string `binding:"required"`
	} `binding:"required,dive,required"`
}

func addTask(ctx *gin.Context) {
	param := addTaskParam{}
	if err := ctx.ShouldBindBodyWith(&param, binding.JSON); err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	param.Name = reg.ReplaceAllString(param.Name, "-")

	for _, chapter := range param.Chapters {
		task := Task{
			Name:        param.Name,
			ChapterName: reg.ReplaceAllString(chapter.Name, "-"),
			Link:        chapter.Link,
		}
		if err := db.Create(&task).Error; err != nil {
			ctx.AbortWithStatus(http.StatusInternalServerError)
			return
		}
		fmt.Println("添加", task.str(), " 成功！")
	}
	ctx.AbortWithStatus(http.StatusOK)
}

func getTask(ctx *gin.Context) {
	task := Task{}
	now := time.Now().Unix()
	db.Where("finished=false and (get=false or (? - get_time > 45))", now).Take(&task)
	if task.ID == 0 {
		ctx.AbortWithStatus(http.StatusNotFound)
		return
	}
	task.Get = true
	task.GetTime = now
	db.Model(&task).Updates(&task)
	fmt.Println(task.str(), " 已被领取")
	ctx.String(http.StatusOK, task.Link)
}

type finishTaskParam struct {
	Link    string `binding:"required"`
	Content string `binding:"required"`
}

func finishTask(ctx *gin.Context) {
	param := finishTaskParam{}
	if err := ctx.ShouldBindBodyWith(&param, binding.JSON); err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	tasks := []Task{}
	db.Where("link = ?", param.Link).Find(&tasks)
	for _, task := range tasks {
		if err := os.MkdirAll(downloadPath+task.Name, os.ModePerm); err != nil {
			fmt.Println(err.Error())
			ctx.AbortWithStatus(http.StatusInternalServerError)
			return
		}

		file, err := os.Create(downloadPath + task.Name + "/" + task.ChapterName + ".m3u8")
		if err != nil {
			fmt.Println(err.Error())
			ctx.AbortWithStatus(http.StatusInternalServerError)
			return
		}
		defer file.Close()

		_, err = file.WriteString(param.Content)
		if err != nil {
			fmt.Println(err.Error())
			ctx.AbortWithStatus(http.StatusInternalServerError)
			return
		}

		task.Finished = true
		if err := db.Model(&task).Updates(&task).Error; err != nil {
			fmt.Println(err.Error())
			ctx.AbortWithStatus(http.StatusInternalServerError)
			return
		}

		var finished, count int
		db.Model(&Task{}).Where("finished=true").Count(&finished)
		db.Model(&Task{}).Count(&count)

		fmt.Println(task.str() + "已完成" + fmt.Sprintf("  (%d/%d)", finished, count))
	}
	ctx.AbortWithStatus(http.StatusOK)
}
