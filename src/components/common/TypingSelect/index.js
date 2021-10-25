import React from 'react';
import { Select } from 'antd';

const { Option } = Select;

const TypingSelect = props => {
  function onChange(value) {
    props.callbackSelection(value);
  }
  function onBlur() {}
  function onFocus() {}
  function onSearch() {}

  const renderOptions = () => {
    const dataList = props.options;
    if (dataList.length) {
      return dataList.map(data => {
        return (
          <Option key={data[props.optionName]} value={data[props.optionValue]}>
            {data[props.optionName]}
          </Option>
        );
      });
    }
    return null;
  };

  let optionRendered = renderOptions();

  return (
    <Select
      value={props.value}
      showSearch
      style={{ width: props.width || '100%' }}
      placeholder={props.placeholder}
      optionFilterProp="children"
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      onSearch={onSearch}
      filterOption={(input, option) =>
        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
      }
      disabled={props.disabled || false}
      defaultValue={props.defaultValue}
    >
      {optionRendered}
    </Select>
  );
};

export default TypingSelect;
