import React, { useEffect, useState } from 'react';
import { Button, Col, Form, Input, message, Modal, Row, Select, Upload } from 'antd';
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from 'utils/firebase';
import { validateMessages } from 'constant/validationMessage';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { useParams } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import testTypeApi from 'api/testTypeApi';
import { createExam, updateExam } from 'redux/actions/exams';
import courseApi from 'api/courseApi';
import { examState$ } from 'redux/selectors';

import styles from './index.module.less';

const { Option } = Select;

const AddFileExam = ({ isVisible, setIsVisible, existedColumn, classData, selectedExam }) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [fileUrls, setFileUrls] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const { idClass } = useParams();
  const checkFileSize = file => {
    if (file) {
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('File(s) must be smaller than 2MB!');
      }
      return isLt2M ? true : Upload.LIST_IGNORE;
    }
    return Upload.LIST_IGNORE;
  };

  const handleOnChange = ({ fileList }) => {
    setFileList(fileList);
  };

  const removeUrl = url => {
    const res = fileUrls.filter(fileUrl => fileUrl.url !== url);
    setFileUrls(res);
  };

  const FileRendered = (url, index) => (
    <Row key={index} gutter={[20, 20]}>
      <Col span={22}>
        <a className={styles['text-url']} href={url} target="_blank" rel="noopener noreferrer">
          {url}
        </a>
      </Col>
      <Col span={2}>
        <Button type="text" icon={<DeleteOutlined />} onClick={() => removeUrl(url)} />
      </Col>
    </Row>
  );

  const uploadFiles = options => {
    const { onSuccess, onError, file, onProgress } = options;
    if (!file) return;
    const fileName = 'files/' + file.name + uuidv4();
    const sotrageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(sotrageRef, file);
    uploadTask.on(
      'state_changed',
      snapshot => {
        const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress(prog);
      },
      error => {
        console.log(error);
        onError(error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(downloadURL => {
          const tmp = [...fileUrls, { uid: file.uid, url: downloadURL }];
          setFileUrls(tmp);
        });
        onSuccess('Ok');
      }
    );
  };

  const dispatch = useDispatch();
  const { isLoading, isSuccess } = useSelector(examState$);
  const handleSubmit = () => {
    form.validateFields().then(values => {
      const { examName, idTestType, idColumn } = values;
      const res = fileUrls.map(element => element.url);
      if (isEdit) {
        dispatch(
          updateExam.updateExamRequest({
            idExam: selectedExam.idExam,
            examName,
            fileUrl: res,
            postedDate: moment().toDate(),
            idTestType,
          })
        );
      } else {
        dispatch(
          createExam.createExamRequest({
            examName,
            fileUrl: res,
            postedDate: moment().toDate(),
            idClass,
            idTestType,
            idColumn,
          })
        );
      }
      // setIsCompleted(true);
      // form.resetFields();
    });
  };

  // load selected exam
  useEffect(() => {
    if (selectedExam) {
      setIsEdit(true);
      form.setFieldsValue({
        examName: selectedExam.examName,
        idTestType: selectedExam.TestType.idTestType,
        idColumn: selectedExam.Column_Transcript.columnName,
        file: selectedExam.fileUrl,
      });
      if (selectedExam.fileUrl.length > 0) {
        const tmp = [];
        selectedExam.fileUrl.map(file => tmp.push({ url: file, uid: uuidv4() }));
        setFileUrls(tmp);
        console.log(tmp);
      }
    } else {
      setIsEdit(false);
      form.resetFields();
    }
  }, [isVisible]);

  // handle message
  useEffect(() => {
    if (isCompleted && !isLoading) {
      isSuccess
        ? message.success(`${isEdit ? 'Edited' : 'Added'} exam successfully`)
        : message.error('There is an error');
    }
    setIsCompleted(false);
    setIsVisible(false);
  }, [isLoading, isSuccess, isCompleted]);

  // init value for select options
  const [columnOption, setColumnOption] = useState();
  const [typeOption, setTypeOption] = useState();
  useEffect(() => {
    form.resetFields();
    courseApi.getById(classData.idCourse).then(res => {
      const tmp = res.data.Columns;
      const result = [];
      tmp.map(col => {
        if (!existedColumn.includes(col.idColumn)) {
          result.push(
            <Option key={col.idColumn} value={col.idColumn}>
              {col.columnName}
            </Option>
          );
        }
      });
      setColumnOption(result);
    });

    testTypeApi.getAllPromiss().then(res => {
      const tmp = res.data;
      const result = tmp.map(type => (
        <Option key={type.idTestType} value={type.idTestType}>
          {type.typeName}
        </Option>
      ));
      setTypeOption(result);
    });
  }, [existedColumn]);

  return (
    <Modal
      centered
      visible={isVisible}
      title="Add files"
      okText="Submit"
      cancelText="Cancel"
      onCancel={() => {
        setIsVisible(false);
        form.resetFields();
        setFileUrls([]);
        setFileList([]);
      }}
      onOk={handleSubmit}>
      <Form
        form={form}
        onFinish={handleSubmit}
        validateMessages={validateMessages}
        layout="vertical">
        <Form.Item name="examName" label="Exam name" rules={[{ required: true }]}>
          <Input placeholder="Exam name" maxLength="255" />
        </Form.Item>
        <Form.Item name="idTestType" label="Type of exam" rules={[{ required: true }]}>
          <Select showSearch placeholder="Exam type">
            {typeOption}
          </Select>
        </Form.Item>
        <Form.Item name="idColumn" label="Column name" rules={[{ required: true }]}>
          <Select disabled={isEdit} showSearch placeholder="Column name">
            {columnOption}
          </Select>
        </Form.Item>
        <Form.Item name="file" label="File">
          <Upload
            multiple={true}
            fileList={fileList}
            onChange={handleOnChange}
            showUploadList={false}
            beforeUpload={checkFileSize}
            customRequest={uploadFiles}>
            <Button block size="middle" icon={<UploadOutlined />}>
              Upload
            </Button>
          </Upload>
        </Form.Item>
        {fileUrls.length > 0 ? fileUrls.map((file, index) => FileRendered(file.url, index)) : ''}
      </Form>
    </Modal>
  );
};

export default AddFileExam;